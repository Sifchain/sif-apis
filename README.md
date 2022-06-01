# Sif-APIs

## Overview


In this repository, you can find all the data endpoints available for the Sifchain DEX. 
You can follow the instruction and create your own database by:
- Fetching data through setting up your own ETL processes through [sif-etl](https://github.com/Sifchain/sif-etl)
- Populating it with the Sifchain database (you will need to ask for credentials on [Discord](https://discord.gg/ZSw72wxF)
in the sdk-integrations [sdk-integrations channel](https://discord.gg/KWaJGzaZ) :mage:	
### Dependencies:
[Node v14.17.4](https://nodejs.org/en/blog/release/v14.17.4)


### How to use it:

Clone the repository:
```
git clone https://github.com/Sifchain/sif-apis
```

Go into the repository: 
```
cd sif-apis
```


Rename the ```.env-example ```file to ```.env ```.  Add to it the credentials to your server:
```
mv .env-example .env
```
Open the newly created ```.env``` file, and add the credentials to your database:
```
nano .env
```
Open the ```openapi.yaml``` file and in the servers sections, add the url to the public IP address of your server. 
You can add it next to the already present  ```http://localhost:8080``` url

```
nano sif-apis/api/openapi.yaml
```


Install the required packages:
```
npm install
```

Start the server:

```
npm run dev
```

Visualize the swagger on your browser by opening:

[http://localhost:8080/docs](http://localhost:8080/docs)


or select the host you want in the Swagger UI. If you have issues, make sure the port 8080 is accessible


-----That's it!-----

Now you can:


Get the data from the sif-apis :crystal_ball:


Have fun by improving the repo through pull requests:muscle:
Please follow the [Contribution Guidelines]([url](https://github.com/Sifchain/sif-apis/blob/master/contribution_guidelines.md))

**Note:**

*If you don't set up your own DB through sif-etl, you will need access to an already existing DB. 
If this is the case, please reach out on Discord to get access. Keep in mind that currently we are only giving access to the DB to active contributors.* :fairy_woman:
