# Doorman

Managing members' presence in the office.

## Running

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

## LICENSE

MIT (see LICENSE.md)
