This project is designed for gathering information from QuickBooks Online API and pushing it to PostgreSQL database for Grafana to use.

## Prepare local environment

Install packages
    
    nvm install 10
    npm install

Prepare local variables file
    
    cat << EOF > ~/.config/qb_auth
    export _db_ip='<secret>'
    export _db_name='<secret>'
    export _db_user='<secret>'
    export _db_pass='<secret>'
    export _qb_username='<secret>'
    export _qb_password='<secret>'
    export _qb_clientId='<secret>'
    export _qb_clientSecret='<secret>'
    EOF

Then execute it  
    
    source ~/.config/qb_auth

## Run the script
    
    node app.js
