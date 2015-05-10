# Autolib Command Line Interface

This is a set of CLI commands allowing to retrieve information from you personal account to display them in a meaningful JSON format.

## Installation

```
npm install -g autolib
```

## Examples

### Run as web application

Use PORT env variable or default port 3788.

```
autolib --service
```

Available routes:
- `/rest/auth` Authenticate on Autolib authentication platform.
- `/rest/status` Get current authenticated status.
- `/rest/usage` Get current rental usage.
- `/rest/rentals` Get current month rentals.
- `/rest/stations` Get stations near a specified address.

Web application available at: `http://localhost:3788/`

### Display current month rentals

```
autolib -u loginemail@domain.ext -p yourpass --rentals
```

Output (or error):

```
[ { start: '08/04/2015 17:10',
    duration: '32 mn',
    from: '10 Quai de la Corniche, 93800 Suresnes',
    to: '31 Bis Rue de Rennes, 75015 Paris',
    amount: 5.86 },
  { start: '04/04/2015 23:05',
    duration: '32 mn',
    from: '100 Avenue du Maine, 75014 Paris',
    to: '6 rue Rochambeau, 75009 Paris',
    amount: 4.03 },
  { start: '17/04/2015 18:57',
    duration: '38 mn',
    from: '52 rue PierreIgor, 92260 Fontenay Aux Roses',
    to: '112 Avenue de SuperMan, 75011 Paris',
    amount: 6.96 } ]
```

### Display your personal information

```
autolib -u <username> -p <pass> --info
```

Output (or error):

```
{ lastname: 'Doe',
  firstname: 'John',
  street: '35 rue Bergère',
  building: '',
  neighborhood: '',
  zipcode: '75012',
  city: 'PARIS',
  birthday: '23/06/1989',
  land_line: '',
  mobile_line: '+33.98472744',
  email: 'someemail@domain.ext',
  language: 'Français' }
```

### Display bills

```
autolib -u <username> -p <pass> --bills
```

Output (or error):

```
[ { number: '1239823',
    date: '04/24/2015',
    status: 'Paid',
    amount: 36.78 },
  { number: '1230988',
    date: '04/24/2015',
    status: 'Paid',
    amount: 5 },
  { number: '1229088',
    date: '04/14/2015',
    status: 'Paid',
    amount: 10.89 },
  { number: '2397888',
    date: '04/07/2015',
    status: 'Paid',
    amount: 26.41 } ]
```

### Display stations near address

```
autolib -u <uname> -p <upass> --near "34 rue du bac, paris"
```

Output (or error):

```
[ { available: 0,
    kind: 'STATION',
    name: 'Paris/Jacques Callot/5',
    rental_status: 'broken',
    address: '5 rue Jacques Callot, 75006 Paris',
    lat: 48.8552045,
    lng: 2.3371078,
    hrid: 'paris-jacquescallot-5' },
  { available: 2,
    kind: 'STATION',
    name: 'Paris/Saint-Germain/188',
    rental_status: 'operational',
    address: '188 boulevard Saint-Germain, 75007 Paris',
    lat: 48.85461,
    lng: 2.329982,
    hrid: 'paris-saintgermain-188' }, ...]

```

### Reserve a car at station id

```
autolib -u <uname> -p <upass> --reserve "paris-saintgermain-188"
```

Output (or error):

```
{ subscriptionId: 234988, reservationId: 123987477 }
```

### Cancel a car reservation

```
autolib -u <uname> -p <upass> --cancel 123987477
```

No output or error.


### Help

```
autolib --help
```
