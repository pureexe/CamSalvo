# CamSalvo
Control mobile device to fire a salvo of image shot using web technology

##  Pre-require 

### Server side 
- Node.js
- SSL (Google chrome won't allow your site access camera if it doesn't using SSL)

###  Camera (phone) side
- Google Chrome (Don't work with other brower)
- Enable insecure origin in chrome://flags in case your server doesn't have SSL

## Run
1. Clone this repo
2. npm start 
3. npx serve public 

However,  In case you want to operate a lot of phone, We reconmmend to use apache or nginx instead of npx