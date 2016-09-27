# Standard library modules
import Queue
import shelve
import sqlite3
import threading
import time
from collections import namedtuple

# Third party libraries
import nmap
import socketio
from flask import Flask, request, json

# Local imports


Device = namedtuple('Device', ['ip', 'mac', 'timestamp'])

CREATE_TABLE = '''CREATE TABLE IF NOT EXISTS seen(
    id INTEGER PRIMARY KEY,
    mac TEXT,
    ip TEXT,
    timestamp INTEGER
)'''


class NmapHarvester:
    """
    Continuously scans the network for MAC addresses and their IPs.

    Use this inside a thread. `infinite_scan` will never return.

    Listen to new scan results with the `register_listener` method.
    """

    def __init__(self, query_range='192.168.0.1-255', secs_between_scans=6):
        self.nm = nmap.PortScanner()
        self.query_range = query_range
        self.listeners = []
        self.time_between_scans = secs_between_scans

    def infinite_scan(self):
        while True:
            results = self._blocking_scan()
            self._broadcast(results)
            time.sleep(self.time_between_scans)

    def register_listener(self, listener):
        if listener not in self.listeners:
            self.listeners.append(listener)

    def drop_listener(self, listener):
        self.listeners.remove(listener)

    def _blocking_scan(self):
        values = []
        timestamp = time.time()
        self.nm.scan(hosts=self.query_range, arguments='-n -sP')
        print('scan results', self.nm.all_hosts())
        for ip in self.nm.all_hosts():
            addresses = self.nm[ip]['addresses']
            if 'mac' in addresses:
                values.append(Device(ip, addresses['mac'], timestamp))
        return values

    def _broadcast(self, results):
        for listener in self.listeners:
            listener(results)


class NetworkDeviceMapping:
    """
    Stores a mapping of the network. Which MAC address belongs to which IP is
    the most important datum, but we store the whole Device information, just
    in case it has extra information.
    """

    def __init__(self):
        self.mac_to_device = {}
        self.ip_to_device = {}

    def seen(self, device):
        self.mac_to_device[device.mac] = device
        self.ip_to_device[device.ip] = device

    def get_mac_for_ip(self, ip):
        return self.ip_to_device[ip].mac

    def get_ip_for_mac(self, mac):
        return self.mac_to_device[mac].ip


class NetworkRecentRegistry:
    """
    Registry of the last seen MAC addresses, with their timestamps.
    """

    def __init__(self):
        self.mac_to_last_timestamp = {}

    def seen(self, device):
        self.mac_to_last_timestamp[device.mac] = device.timestamp

    def expire_entries_before_timestamp(self, timestamp):
        for mac in self.mac_to_last_timestamp.keys():
            device_timestamp = self.mac_to_last_timestamp[mac]
            if device_timestamp < timestamp:
                del self.mac_to_last_timestamp[mac]

    def latest_macs(self):
        return self.mac_to_last_timestamp.keys()


class NetworkLogger:
    """
    Stores seen MAC addresses, with their timestamps, into a database.
    """

    def __init__(self, url='storage.sqlite3'):
        self.url = url
        self.queue = Queue.Queue()

    def init(self):
        self.db = sqlite3.connect(self.url)
        self.db.execute(CREATE_TABLE)
        self.db.commit()

    def await_queue(self):
        while True:
            devices = self.queue.get()
            self.db.executemany(
                'INSERT INTO seen(mac, ip, timestamp) VALUES(?, ?, ?)',
                devices
            )
            self.db.commit()

    def push_devices(self, devices):
        self.queue.put(devices)


class MacToUser:
    """
    Doorman also stores information about each user.
    """

    def __init__(self):
        self.mac_to_user = shelve.open('profiles.storage')

    def associate(self, mac, user):
        self.mac_to_user[str(mac)] = user

    def get_for_mac(self, mac):
        if str(mac) in self.mac_to_user:
            return self.mac_to_user[mac]
        else:
            return {'unregistered': True}


class HTTPServer:

    def __init__(self, mac_to_user, network_mapping, recents):
        self.app = Flask(__name__)
        self.app.debug = True
        self.app._static_folder = 'dist'

        self.sio = socketio.Server(async_mode='threading')

        self.mac_to_user = mac_to_user
        self.network_mapping = network_mapping
        self.recents = recents

        self.map_socket_to_ip = {}
        self.map_ip_to_socket = {}

        self.app.wsgi_app = socketio.Middleware(self.sio, self.app.wsgi_app)

        self.setup_api()
        self.setup_websocket()
        self.setup_admin_endpoints()
        self.setup_static()

    def setup_static(self):
        app = self.app

        @app.route('/main.js')
        def serve_app():
            return self.serve_file('main.js')

        @app.route('/main.js.map')
        def serve_app_map():
            return self.serve_file('main.js.map')

        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_index(path):
            return self.serve_file('index.html')

    def serve_file(self, path):
        return self.app.send_static_file(path)

    def setup_api(self):
        app = self.app

        @app.route('/profile/<mac>', methods=['GET'])
        def get_profile(mac):
            profile = self.mac_to_user.get_for_mac(mac)
            if not profile:
                return json.jsonify(not_found=True)
            return json.dumps(profile)

        @app.route('/profiles', methods=['POST'])
        def get_profiles():
            query = request.get_json()
            print(query)

            results = {}
            for mac in query:
                results[mac] = self.mac_to_user.get_for_mac(mac)
            return json.dumps(results)

        @app.route('/profile', methods=['POST'])
        def put_profile():
            ip = request.remote_addr
            mac = self.network_mapping.get_mac_for_ip(ip)
            if not mac:
                return json.jsonify(success=False)

            profile = request.get_json()
            self.mac_to_user.associate(mac, profile)
            self.notify_new_association(mac, profile)

            return json.jsonify(success=True)

        @app.route('/associations')
        def associations():
            return json.dumps(dict(self.mac_to_user.mac_to_user.items()))

        @app.route('/latest_macs')
        def latest_macs():
            return json.dumps(self.recents.mac_to_last_timestamp)

    def setup_websocket(self):
        sio = self.sio

        @sio.on('connect')
        def connect(socket_id, environ):
            ip = environ['REMOTE_ADDR']
            self.map_socket_to_ip[socket_id] = ip
            self.map_ip_to_socket[ip] = socket_id

    def setup_admin_endpoints(self):
        app = self.app

        @app.route('/admin_associate', methods=['POST'])
        def admin_associate():
            query = request.get_json()

            mac = query['mac']
            profile = query['profile']

            self.mac_to_user.associate(mac, profile)
            self.notify_new_association(mac, profile)

            return json.jsonify(success=True)

    def notify_new_association(self, mac, profile):
        self.sio.emit('association', {'mac': mac, 'profile': profile})

    def notify_latest_macs(self, macs):
        self.sio.emit('macs', macs)

    def listen(self):
        self.app.run(threaded=True, host='0.0.0.0', port=8081)


class Orchestrator:

    def __init__(self):
        self.harvester = NmapHarvester()

        self.mapping = NetworkDeviceMapping()
        self.recents = NetworkRecentRegistry()

        self.logger = NetworkLogger()
        self.mac_to_user = MacToUser()

        self.server = HTTPServer(self.mac_to_user, self.mapping, self.recents)

        self.setup_dispatch()
        self.setup_threads()

        self.start_threads()

    def setup_dispatch(self):

        def dispatch_to_all(devices):
            print('new macs', devices)
            for device in devices:
                self.mapping.seen(device)
                self.recents.seen(device)

        def dispatch_to_logger_queue(devices):
            self.logger.push_devices(devices)

        def notify_clients(devices):
            macs = self.recents.latest_macs()
            self.server.notify_latest_macs(macs)

        self.harvester.register_listener(dispatch_to_all)
        self.harvester.register_listener(dispatch_to_logger_queue)
        self.harvester.register_listener(notify_clients)

    def setup_threads(self):
        def cleanup_older():
            while True:
                timestamp = time.time() - 60  # seconds
                self.recents.expire_entries_before_timestamp(timestamp)

                macs = self.recents.latest_macs()
                self.server.notify_latest_macs(macs)

                time.sleep(30)

        def infinite_scan():
            self.harvester.infinite_scan()

        def logger_await():
            self.logger.init()
            self.logger.await_queue()

        self.thread_targets = [
            infinite_scan,
            cleanup_older,
            logger_await
        ]

    def start_threads(self):
        self.threads = []
        for thread_target in self.thread_targets:
            thread = threading.Thread(target=thread_target)
            thread.start()
            self.threads.append(thread)
        self.server.listen()

if __name__ == '__main__':
    Orchestrator()
