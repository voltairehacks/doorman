# Doorman

Managing members' presence in the office.

## Running

Quick & dirty:
```
    virtualenv env
    source env/bin/activate
    # in /webapp
    pip install -r requirements.txt
    sudo python main.py
    # in /webapp
    yarn i
    yarn start
    # Start a postgres database and install the schema
    psql < schema.sql
    # Start the postgraphile server
    npm i -g postgraphile
    postgraphile -c postgres://doorman@localhost/doorman -o -n 0.0.0.0
```

And then [http://localhost:3000](http://localhost:3000)

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
