const {v2}=require("cloudinary");

v2.config({
 cloud_name:"fkmobexk",
 api_key:"897217516222813",
 api_secret:"ADsRs5m536TJbX4VtEFMMErSvWQ"
});


v2.api.ping()
.then(console.log)
.catch(console.error);