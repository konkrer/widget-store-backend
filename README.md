# Widget-Store-Backend
## Backend API for widget-store generic storefront.
[![Node.js CI](https://github.com/konkrer/widget-store-backend/actions/workflows/node.js.yml/badge.svg)](https://github.com/konkrer/widget-store-backend/actions/workflows/node.js.yml)



## Project Description
*This project was done as a final Capstone project for the Springboard Software Engineering Career Track program. This project was chosen for it's technical challenge in creating a secure, reliable application from the ground up for e-commerce.*  

A generic e-commerce storefront built as a single page application (SPA) using React/Redux in the front-end, an Express based API service using a PostgreSQL database in the back-end including Braintree payment processor integration in the front and back end. This app can currently process credit card and PayPal payments in a sandbox environment.  

For maximum application security and stability this app employs extensive test coverage (100%) in the front and back end.

To ensure a secure ordering flow this app employs a transaction based approach to order creation in the back-end server with only valid orders able to be completed. As soon as an order is received (in the back-end) the integrity of the order is checked. Tampering with the order data sent from the front-end, insufficient quantity (stock) of products, or any payment processing problems or errors all result in transaction failure. While proper logging of such events is not currently implemented it is duly noted that logging would be implemented if this app were to be further developed.  

To ensure accuracy of money related calculations this app employs Decimal.js in the front and back end to avoid pitfalls of floating point based calculations when dealing with discreet monetary values. The PostgreSQL database in the back-end declares the Numeric type for all monetary values ensuring database calculations also avoid any floating point pitfalls when dealing with monetary calculations.  


### Notable Features

- 100% test coverage.
- Reliable and secure checkout functionality.
- Functioning payment integration.

## Use

###### Install 

    npm i

###### Setup database

1. Create postgres db named `widget-store`.
2. Run `\i dbSetup.sql` after connecting to database "widget-store" in psql shell.
3. Run  `node dbDataFaker.js` in normal shell (not psql shell).  
4. To be able to run tests create postgres db named `widget-store-test`

###### Project Scripts

    1. npm start               - run express server.
    2. npm run start:dev       - run express development server using nodemon.
    3. npm run start:debug	   - debug  with inspector - e.g.-> chorme:inspector
    2. npm test                - run test suite.
    3. npm run test:coverage   - run test suite with istanbul coverage report.
    4. npm run test:debug      - debug tests with inspector - e.g.-> chorme:inspector


## About

### Tech Stack:

- Express  
\- JavaScript server app running on node.js  

- Postgres  
\- database

- pg  
\- collection of node.js modules for interfacing with a PostgreSQL database.  

- bcrypt  
\- password hashing utility

- jsonwebtoken  
\-  token credential standard

- jsonschema  
\- JSON document validation  

- jest  
\-  testing framework

- supertest  
\- HTTP testing of API routes

- istanbul  
\- testing coverage reports 

- decimal.js  
\- utility class for discreet value calculations

### Database Schema:

![Database Schema Map](https://repository-images.githubusercontent.com/323063245/dccd9800-70cd-11eb-8b37-cc63bb623873)


### Test Coverage:

		--------------------------|---------|----------|---------|---------|-------------------
		File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
		--------------------------|---------|----------|---------|---------|-------------------
		All files                 |     100 |      100 |     100 |     100 | 
		 backend                  |     100 |      100 |     100 |     100 | 
		  app.js                  |     100 |      100 |     100 |     100 |                   
		  braintreeGateway.js     |     100 |      100 |     100 |     100 |                   
		  db.js                   |     100 |      100 |     100 |     100 | 
		 backend/middleware       |     100 |      100 |     100 |     100 | 
		  auth.js                 |     100 |      100 |     100 |     100 | 
		 backend/models           |     100 |      100 |     100 |     100 | 
		  distributor.js          |     100 |      100 |     100 |     100 |                   
		  order.js                |     100 |      100 |     100 |     100 |                   
		  product.js              |     100 |      100 |     100 |     100 | 
		  user.js                 |     100 |      100 |     100 |     100 | 
		 backend/routes           |     100 |      100 |     100 |     100 | 
		  auth.js                 |     100 |      100 |     100 |     100 |                   
		  distributors.js         |     100 |      100 |     100 |     100 |                   
		  orders.js               |     100 |      100 |     100 |     100 | 
		  products.js             |     100 |      100 |     100 |     100 |                   
		  users.js                |     100 |      100 |     100 |     100 |                   
		 backend/utils            |     100 |      100 |     100 |     100 | 
		  createToken.js          |     100 |      100 |     100 |     100 |                   
		  moneyFuncts.js          |     100 |      100 |     100 |     100 | 
		  partialUpdate.js        |     100 |      100 |     100 |     100 | 
		  verifyOrderDataValid.js |     100 |      100 |     100 |     100 | 
		--------------------------|---------|----------|---------|---------|-------------------