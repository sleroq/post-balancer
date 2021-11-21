# post-balancer
[![Run on Repl.it](https://repl.it/badge/github/sleroq/post-balancer)](https://repl.it/github/sleroq/post-balancer)\
 Schedule your telegram posts automatically - [@postbalancer_bot](https://t.me/postbalancer_bot)

# Idea
 Just send your messages to the bot and it will decide what to publish and when by itself.\
 Bot will take into account the following configurable parameters
 - Day of the week
 - Holidays
 - Time zone
 - Custom preferred/undesirable hours/days
 - Maximum number of posts for one day/week
 - Minimum number of posts for one day/week

---
## Running your own instance

### Pre-reqs:
 - <p id="what-token">get bot token from <a href="https://t.me/BotFather">@BotFather</a></p>
 - <p id="what-database">create mongo database <a href="https://www.mongodb.com/try">@BotFather</a> (it's free), whitelist your ip or allow access from anywhere by whitelisting <code>0.0.0.0/0</code> and get special url for connecting application to database (looks like this <code>mongodb+srv://123.hehe.mongodb.net/myHundredthDatabase?retryWrites=true&w=majority</code>)</p>

 ### Deploying the bot:
 Clone repository:\
 ```git clone https://github.com/sleroq/post-balancer.git```
 
 Move inside project's folder\
 `cd post-balancer`

 Install dependencies and build the source code\
 `npm run install && npm run build`

 Add <a href="#what-token">bot's token</a> to `.env` file\
 `echo 'BOT_TOKEN:"yourtokentokentoken"' > .env`

 Add <a href="#what-database">url for connecting to a Database</a> to `.env` file\
 `echo 'MONGODB:"put your url here"' >> .env`

 Start the bot!\
 `npm start`

 ---
 ## Development progress (todo)
 - [ ] Basic information commands
   - [x] /start
   - [ ] /help
 - [x] Connection with database
 - [x] Adding new channels
 - [ ] Adding posts
 - [ ] Changing settings
 - [ ] Show current schedule
 - [ ] Post Preview
 - [ ] Adding custom buttons
 - [ ] Post autodelete feature
 - [ ] i18n
   - [ ] Russian
   - [ ] German