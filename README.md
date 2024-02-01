# Express API - Jogo da Onça:

This API communicates with [Jogo da Onça](https://github.com/IES300-Jogo-da-Onca/jogo-da-onca).

# Pre-requisites:

- **Node.js** v16;
- **MySQL** instance with migrations from /migrations folder (follow the numbered sequence of file names: first 01_CreateDatabase.sql, then 02_skin_table.sql, then 03_usuario_table.sql, and so on). Use tools like MySQL Workbench or some other relative tool to connect to database and run SQL scripts.

# Install Dev Environment:

1. Clone the repo, navigate to the project folder in the terminal;
2. Install dependencies with `npm install`;
3. Create a .env file (model in .env.example) with database connection variables.
4. Run `npm run dev` to start development server at http://localhost:3001.

### Tips

1. Test API calls using [Postman](https://www.getpostman.com/).

> Find a postman collection in /postman-collection. Just import the file to Postman after installation and start to test!

2. Obtain "Super User" access by setting "ehSuperUser" to 1 in "usuario" table, allowing access to the game's frontend management interface.
