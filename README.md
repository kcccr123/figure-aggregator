<!-- PROJECT LOGO 
<br />
<div align="center">
  <a href="https://github.com/github_username/repo_name">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>
-->

<h3 align="center">Figure Aggregator</h3>

<p align="center">
  A Shopify-style online store for toys and models with automated data aggregation.
  <br />
</p>

<!-- ABOUT THE PROJECT -->
## About The Project

Figure Aggregator is a personal learning project that unifies multiple collectible figure retailers into a single storefront. It provides basic quality-of-life features such as browsing, filters, and search functionality, allowing users to easily view products from a variety of stores in one location. Featured items from these stores are also displayed on the homepage.

### Built With

![JavaScript Badge](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=for-the-badge)
![ReactJS](https://img.shields.io/badge/-ReactJs-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![Node.js Badge](https://img.shields.io/badge/Node.js-393?logo=nodedotjs&logoColor=fff&style=for-the-badge)
![Express Badge](https://img.shields.io/badge/Express-000?logo=express&logoColor=fff&style=for-the-badge)

![MySQL Badge](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=fff&style=for-the-badge)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Google Cloud](https://img.shields.io/badge/GoogleCloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white)

### Frontend
The frontend is built with React.js, and products are dynamically displayed via Axios calls to the API. It is currently deployed on Netlify.

https://figure-center.netlify.app/

### Backend
The backend architecture runs on Google Cloud Platform, specifically on Google Kubernetes Engine.

We provision a global static IP and attach it to an HTTPS Load Balancer, which is configured by GKE’s Ingress Controller. Incoming requests hit the Load Balancer, which applies host- and path-based rules to forward traffic to a Service (backed by NEGs/NodePorts) inside the cluster.

That Service routes API calls to Docker-containerized Express.js pods running on GKE. Each pod includes a Cloud SQL Proxy sidecar to maintain the connection to a MySQL (Cloud SQL) instance, allowing the backend to scale up or down without any changes to the database configuration.

A Puppeteer-based scraper runs as a Kubernetes CronJob in GKE, automatically collecting and updating product data in the Cloud SQL database.

<!-- CONTACT -->
## Contact

Feel free to contact me at:  
@Kevin Chen – kevinz.chen@mail.utoronto.ca  
