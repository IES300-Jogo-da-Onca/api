# Express API - Jogo da Onça:

This is the API made to communicate with [Jogo da Onça](https://github.com/IES300-Jogo-da-Onca/jogo-da-onca).

# Pre-requisites:

- **Node.js** v16;
- **MySQL** instance with all migrations from this repo /migrations folder performed following the numbered sequence of file names (01_CreateDatabase... , 02_skin_table.sql, 03_usuario_table.sql, and so on). To achieving this, we recommend to use MySQL Workbench or some other relative tool to connect to database and run SQL scripts.

# Install Dev Environment?

1. Clone this repository in your machine, open a terminal and navigate to the project folder;
2. Install dependencies with `npm install`;
3. Create an .env file on the root of the project following the .env.example file as model. There you need to set the variables to connect to your database.
4. Run `npm run dev` to start development server;
5. The API will be available on http://localhost:3001.

### Tips

1. Use Postman to test API calls. [https://www.getpostman.com/](https://www.getpostman.com/).

> You can find a postman collection on /postman-collection. You'll just need to import the file to Postman after installation and start to test!

2. Get "Super User" access setting the flag "ehSuperUser" to 1 on "usuario" table. This will allow you to access the management interface on the frontend of the game.
