# Autolib Command Line Interface

This is a set of CLI commands allowing to retrieve information from you personal account to display them in a meaningful JSON format.

## Installation

```
npm install -g autolib
```

## Examples

Display current month rentals

```
autolib -u loginemail@domain.ext -p yourpass --rentals
```

Output (fake):

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
