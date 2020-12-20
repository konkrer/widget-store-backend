-- Database setup for Widget Store

DROP TABLE IF EXISTS orders_products;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS distributors;
DROP TABLE IF EXISTS users;

CREATE TABLE distributors (
    distributor_id INT GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(500) NOT NULL UNIQUE,
    address VARCHAR(1000),
    phone_number VARCHAR(25),
    extension VARCHAR(10),
    email VARCHAR(255),
    company_contact VARCHAR(100),
    website VARCHAR(255),
    logo_url VARCHAR(2083),
    PRIMARY KEY(distributor_id)
);

CREATE TABLE departments (
    name VARCHAR(50) PRIMARY KEY
);

INSERT INTO departments
VALUES ('All Departments');


CREATE TABLE products (
    product_id INT GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(500) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image_url VARCHAR(2083),
    price NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(2,2) DEFAULT .00 CHECK (discount < .8),
    date_added DATE DEFAULT CURRENT_DATE,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    department VARCHAR NOT NULL DEFAULT 'All Departments',
    distributor INTEGER,
    sku VARCHAR(255),
    rating INTEGER,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY(product_id),
    CONSTRAINT fk_distributor
        FOREIGN KEY(distributor)
            REFERENCES distributors(distributor_id)
            ON DELETE SET NULL,
    CONSTRAINT fk_department
        FOREIGN KEY(department)
            REFERENCES departments(name)
            ON DELETE SET DEFAULT
);

CREATE TABLE users (
    user_id INT GENERATED ALWAYS AS IDENTITY,
    username VARCHAR(55) NOT NULL UNIQUE,
    email VARCHAR(60) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    first_name VARCHAR(55),
    last_name VARCHAR(55),
    address VARCHAR(1000),
    apt_number VARCHAR(5),
    city VARCHAR(55),
    state VARCHAR(55),
    postal_code VARCHAR(5),
    phone_number VARCHAR(25),
    avatar_url VARCHAR(2083),
    email_validated BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(user_id)
);

CREATE TABLE orders (
    order_id INT GENERATED ALWAYS AS IDENTITY,
    customer INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    distinct_cart_items INTEGER NOT NULL,
    total_items_quantity INTEGER NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL,
    shipping_cost NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    shipping_method VARCHAR(20) NOT NULL,
    tracking_number VARCHAR(255),
    shipping_address VARCHAR(1000),
    order_date DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY(order_id),
    CONSTRAINT fk_customer
        FOREIGN KEY(customer)
            REFERENCES users(user_id)
            ON DELETE SET NULL
);

CREATE TABLE orders_products (
    order_id INTEGER REFERENCES orders(order_id) ON DELETE cascade,
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL
);