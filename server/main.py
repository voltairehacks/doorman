# Standard library modules
import Queue
import shelve
import threading
import psycopg2
import time
from collections import namedtuple

# Third party libraries
import nmap
import socketio

# Local imports


Device = namedtuple('Device', ['ip', 'mac', 'timestamp'])

class NmapHarvester:
    """
    Continuously scans the network for MAC addresses and their IPs.

    Use this inside a thread. `infinite_scan` will never return.

    Listen to new scan results with the `register_listener` method.
    """

    def __init__(self, query_range='192.168.1.1-255', secs_between_scans=60):
        self.nm = nmap.PortScanner()
        self.query_range = query_range
        self.listeners = []
        self.time_between_scans = secs_between_scans

    def infinite_scan(self):
        while True:
            results = self._blocking_scan()
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

    def __init__(self, url='postgres://doorman@localhost/doorman'):
        self.url = url
        self.queue = Queue.Queue()

    def init(self):
        self.db = psycopg2.connect(self.url)

    def await_queue(self):
        while True:
            devices = self.queue.get()
            cur = self.db.cursor()
            for device in devices:
                cur.execute(
                    'INSERT INTO devices(name, mac) VALUES(%s, %s) ON CONFLICT DO NOTHING',
                    ('unknown device', device[1])
                )
                cur.execute(
                    'INSERT INTO seen(mac, ip) VALUES(%s, %s)',
                    (device[1], device[0])
                )
            self.db.commit()
            cur.close()

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


class Orchestrator:

    def __init__(self):
        self.harvester = NmapHarvester()

        self.mapping = NetworkDeviceMapping()
        self.recents = NetworkRecentRegistry()

        self.logger = NetworkLogger()
        self.mac_to_user = MacToUser()

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

        self.harvester.register_listener(dispatch_to_all)
        self.harvester.register_listener(dispatch_to_logger_queue)
        self.harvester.register_listener(notify_clients)

    def setup_threads(self):
        def cleanup_older():
            while True:
                timestamp = time.time() - 60  # seconds
                self.recents.expire_entries_before_timestamp(timestamp)

                macs = self.recents.latest_macs()

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

if __name__ == '__main__':
    Orchestrator()
