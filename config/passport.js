"use strict"
const db = require("../app/database/models"),
      OpenIDStrategy = require("passport-openid").Strategy;

module.exports = (passport) => {

    passport.serializeUser((user, done) => {
        done(null, user.steamId);
    });
    passport.deserializeUser((id, done) => {
        done(null, {
            steamId: id
        });
    });

    passport.use("steam-auth", new OpenIDStrategy({
        providerURL: "http://steamcommunity.com/openid",
        stateless: true,
        returnURL: "http://localhost:3000/auth/openid/return",
        realm: "http://localhost:3000/"
        }, (id, done) => {

            process.nextTick(async() => {

                let user;
                let steamId = id.match(/\d+$/)[0];
                try {
                    user = await db.user.findById(steamId);
                } catch(err) {
                    return done(err);
                }
                if(user === null) {
                    try {
                        user = await db.user.create({
                            steamId: steamId
                        });
                    } catch(err) {
                        return done(err);
                    }
                    if(user !== null) {
                        return done(null, user);
                    } else {
                        return done(null, false, req.flash("signinMessage", "Failed to process your sign in information."));
                    }
                } else {
                    return done(null, user);
                }
            });
        }));
};