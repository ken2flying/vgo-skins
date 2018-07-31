"use strict";

const UsersController = require("./controllers/users.controller"),
      GamesController = require("./controllers/games.controller"),
      userUtils       = require("../libs/user_utils");

module.exports = (app, passport) => {

    app.get('/', async(req, res) => {
        if(req.user) {
            res.redirect("/games/roulette/plant");
        } else {
            res.render("pages/home.ejs");
        }
    });

    app.get("/user/profile/:id", UsersController.isLoggedIn, UsersController.getProfile);
    app.get("/user/items", UsersController.isLoggedIn, UsersController.getAvailableItems);
    app.post("/user/tradeUrl", UsersController.isLoggedIn, UsersController.postTradeUrl);
    app.post("/user/auth/openid", passport.authenticate("steam-auth"));
    app.get("/user/auth/openid/return", passport.authenticate("steam-auth"), UsersController.handleOpenIDReturn);
    app.post("/user/logout", UsersController.isLoggedIn, UsersController.postLogout);

    app.get("/games/roulette/:rouletteType", UsersController.isLoggedIn, GamesController.getRoulette);
    app.post("/games/roulette/:rouletteType/:itemsGambled", UsersController.isLoggedIn, GamesController.postRouletteStake);
    app.get("/games/headon", UsersController.isLoggedIn, GamesController.getHeadon);
};