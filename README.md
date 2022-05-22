# Mimir

## Overview
In Norse mythology, Mimir is the entity famous for his knowledge and wisdom. His enlightened advices are valuable to obtain guidance and direction. :mage:	

In this repository, you can find all the data endpoints available for the Sifchain DEX. 
You can follow the instruction and create your own database by:
- Fetching data through setting up your own ETL processes 
- Populating it with the Sifchain database Vanir

### Dependencies:
[Node v14.17.4](https://nodejs.org/en/blog/release/v14.17.4)


### How to use it:

Clone the repository:
```
git clone https://github.com/Sifchain/mimir
```

Go into the repository: 
```
cd mimir
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
nano mimir/api/openapi.yaml
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


Get the knowledge from the Sifchain Gods:crystal_ball:


Have fun by improving the repo through pull requests:muscle:


![mimir](https://user-images.githubusercontent.com/67415638/169348880-37dbf8ca-c1c3-42c0-8cb7-56033fdd2538.jpeg)


