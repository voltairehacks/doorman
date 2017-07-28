# Doorman

Managing members' presence in the office.

## Running

Quick & dirty:
```
    virtualenv env
    source env/bin/activate
    # un /webapp
    pip install -r requirements.txt
    # in server
    npm i
    webpack
    # in /webapp again
    sudo python server.py
```

And then [http://localhost:5000](http://localhost:5000)

## Hacking

```
    webpack -w &
    sudo python server.py
```

## Caveats

Localhost is never in the ARP memory, so no reverse lookup ARP->Profile can be made. Use your phone to debug.

Currently the profile must be `{name: 'something', email: 'something'}` or shit breaks. And is being sent as a string inside the socket.io message, not as an object.

If `email` in that profile contains a `@`, gravatar is used.

## LICENSE

MIT (see LICENSE.md)
