'use strict';
const request = require("request-promise"),
      baseUri = "http://api.steampowered.com";

module.exports = (sequelize, DataTypes) => {
  const CoinflipHistory = sequelize.define('CoinflipHistory', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    winner: DataTypes.BIGINT,
    host: DataTypes.BIGINT,
    challenger: DataTypes.BIGINT,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {});

  CoinflipHistory.getHistory = function(query = {}, limit = 5, cb = null) {
    CoinflipHistory.findAll({
      limit: 5,
      where: query,
      order: [[ "id", "DESC" ]]
    }).then(history => {
      let stakePromisesArray = [];
      history.forEach(lobby => {
        stakePromisesArray.push(sequelize.models.CoinflipStakes.findOne({ where: { id: lobby.host }}));
        stakePromisesArray.push(sequelize.models.CoinflipStakes.findOne({ where: { id: lobby.challenger }}));
      });
      Promise.all(stakePromisesArray).then(stakes => {
        let requestedUsers = {};
        let userRequestArray = [];
        for(let index = 0, length = stakes.length; index < length; index += 2) {
          if(!requestedUsers[stakes[index].user]) {
            requestedUsers[stakes[index].user] = {};
            userRequestArray.push(stakes[index].user);
          }
          if(!requestedUsers[stakes[index+1].user]) {
            requestedUsers[stakes[index+1].user] = {};
            userRequestArray.push(stakes[index+1].user);
          }
        }
        request({
          uri: `${baseUri}/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${userRequestArray.join(',')}`,
          json: true
        }).then(users => {
          users.response.players.forEach(profile => {
            requestedUsers[profile.steamid] = {
              name: profile.personaname,
              avatar: profile.avatarfull
            };
          });
          for(let index = 0, length = stakes.length; index < length; index += 2) {
            history[index/2].host = {
              userId: stakes[index].user,
              total: stakes[index].total,
              stake: stakes[index].stake,
              ...requestedUsers[stakes[index].user]
            };
            history[index/2].challenger = {
              userId: stakes[index+1].user,
              total: stakes[index+1].total,
              stake: stakes[index+1].stake,
              ...requestedUsers[stakes[index+1].user]
            };
          }
          if(cb) {
            cb(history.map(round => round.dataValues));
          } 
        });
      });
    });
  };

  CoinflipHistory.getLobby = function(lobbyId, cb = null) {
    CoinflipHistory.findOne(
      { where: { id: lobbyId }}
    ).then(lobby => {
      Promise.all([
        sequelize.models.CoinflipStakes.findOne({ where: { id: lobby.host }}),
        sequelize.models.CoinflipStakes.findOne({ where: { id: lobby.challenger }})
      ]).then(stakes => {
        let requestedUsers = stakes.map(stake => stake.user).join(',');
        request({
          uri: `${baseUri}/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${requestedUsers}`,
          json: true
        }).then(data => data.response.players)
          .then(users => {
          lobby.host = {
            userId: stakes[0].user,
            total: stakes[0].total,
            items: stakes[0].stake,
            name: users[0].personaname,
            avatar: users[0].avatar
          };
          lobby.challenger = {
            userId: stakes[1].user,
            total: stakes[1].total,
            items: stakes[1].stake,
            name: users[1].personaname,
            avatar: users[1].avatar
          };
          if(cb) {
            cb(lobby.dataValues);
          }
        });
      });
    });
  };

  CoinflipHistory.associate = function(models) {
    
  };
  return CoinflipHistory;
};