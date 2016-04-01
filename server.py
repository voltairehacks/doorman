from flask import Flask, render_template
import nmap
import socketio
import threading
import os
import time
from shove import Shove

nm = nmap.PortScanner()
sio = socketio.Server(async_mode='threading')
app = Flask(__name__, static_url_path='/static')

current_pairs = Shove('file://' + os.getcwd() + 'profiles.shove')

map_sid_to_addr = {}
map_addr_to_sid = {}
map_addr_to_mac = {}
last_scan = []

def shoveToDict(shove):
    return dict([a, shove[a]] for a in shove)


def sid_to_mac(sid):
    if sid not in map_sid_to_addr:
        print(sid, 'not found')
        return None
    if map_sid_to_addr[sid] not in map_addr_to_mac:
        print(sid, 'not found in addr to mac', map_addr_to_mac)
        return None
    return map_addr_to_mac[map_sid_to_addr[sid]]


@app.route('/')
def index():
    """Serve the client-side application."""
    return render_template('index.html')


@sio.on('connect')
def connect(sid, environ):
    map_sid_to_addr[sid] = environ['REMOTE_ADDR']
    if environ['REMOTE_ADDR'] in map_addr_to_mac:
        map_addr_to_sid[environ['REMOTE_ADDR']] = sid
        if sid_to_mac(sid) in current_pairs:
            sio.emit('name', current_pairs[sid_to_mac(sid)], room=sid)
    sio.emit('pairs', shoveToDict(current_pairs), room=sid)
    sio.emit('clients', last_scan, room=sid)
    print('client connected ', sid)


@sio.on('disconnect')
def disconnect(sid):
    print('disconnect ', sid)


@sio.on('associate')
def associate(sid, data):
    mac = sid_to_mac(sid)
    if mac:
        current_pairs[mac] = data
        sio.emit('new_pair', {mac: data})


def loop():
    while True:
        nm.scan(hosts='192.168.1.1-255', arguments='-n -sP')
        for x in nm.all_hosts():
            if 'mac' in nm[x]['addresses']:
                map_addr_to_mac[x] = nm[x]['addresses']['mac']
        new_scan = [unique for unique in set([nm[x]['addresses']['mac']
                                              for x in nm.all_hosts()
                                              if 'mac' in nm[x]['addresses']])]
        print(new_scan)
        last_scan = new_scan
        sio.emit('clients', last_scan)
        time.sleep(6)


def server():
    app.run(threaded=True, host='0.0.0.0')

app.wsgi_app = socketio.Middleware(sio, app.wsgi_app)

threading.Thread(target=loop).start()
threading.Thread(target=server).start()
