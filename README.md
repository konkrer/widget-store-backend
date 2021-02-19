# Widget-Store-Backend
[![Node.js CI](https://github.com/konkrer/widget-store-backend/actions/workflows/node.js.yml/badge.svg)](https://github.com/konkrer/widget-store-backend/actions/workflows/node.js.yml)

##### Backend API for widget-store generic storefront. 100% test coverage.

###### Tech Stack:

Express, Postgres, pg, bcrypt, jsonwebtoken, jsonschema, jest, supertest, istanbul, decimal.js

![Database Schema Map](https://repository-images.githubusercontent.com/323063245/dccd9800-70cd-11eb-8b37-cc63bb623873)

###### Test Coverage:

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