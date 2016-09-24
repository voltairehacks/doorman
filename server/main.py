# Standard library modules
import time
from collections import namedtuple

# Third party libraries
import nmap

# Local imports


Device = namedtuple('Device', ['ip', 'mac', 'timestamp'])


class NmapHarvester:
    """
    Continuously scans the network for MAC addresses and their IPs.

    Use this inside a thread. `infinite_scan` will never return.

    Listen to new scan results with the `register_listener` method.
    """

    def __init__(self, query_range='192.168.1.1-255', secs_between_scans=6):
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
            self.listeners.push(listener)

    def drop_listener(self, listener):
        self.listeners.remove(listener)

    def _blocking_scan(self):
        values = []
        timestamp = time.time()
        self.nm.scan(hosts=self.query_range, arguments='-n -sP')
        for ip in self.nm.all_hosts():
            addresses = self.nm[ip]['addresses']
            if 'mac' in addresses:
                values.push(Device(ip, addresses['mac'], timestamp))
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
    """ Registry of the last seen MAC addresses, with their timestamps. """

    def __init__(self):
        self.mac_to_last_timestamp = {}

    def seen(self, device, timestamp):
        self.mac_to_last_timestamp[device.mac] = timestamp

    def expire_entries_before_timestamp(self, timestamp):
        for mac, device_timestamp in self.mac_to_last_timestamp:
            if device_timestamp < timestamp:
                del self.mac_to_last_timestamp[mac]


class MacToUser:
    """ Doorman also stores information about each user. """

    def __init__(self):
        self.mac_to_user = {}

    def associate(self, mac, user):
        self.mac_to_user[mac] = user

    def get_for_mac(self, mac):
        return self.mac_to_user[mac]


class DoormanServer:

    def __init__(self):
        self.recent = NetworkRecentRegistry()
        self.mac_to_user = MacToUser()
        self.devices = NetworkDeviceMapping()


class Orchestrator:

    def __init__(self):
        self.server = DoormanServer()
        self.harvester = NmapHarvester()

        self.threadTargets = []
