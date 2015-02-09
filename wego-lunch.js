Places = new Mongo.Collection("places");
Chosen = new Mongo.Collection("chosen");

if (Meteor.isClient) {
  Deps.autorun(function() {
    if (Meteor.user()) {
      Meteor.subscribe("allUsers");
      Meteor.subscribe("allPlaces");
      Meteor.subscribe("allVotes");
    }
  });

  Template.lunch.helpers({
    places: function () {
      return Places.find({}, {sort: {place: '1'}});
    },

    results: function () {
      return Chosen.find({}).count();
    },

    users: function () {
      return Meteor.users.find({}).count();
    },

    topPlaces: function () {
      return Places.find({}, {sort: {count: '-1'}, limit: 3});
    }

  });

  Template.lunch.events({
    'change li': function () {
      var chosen_place = this.place;
      if ( Chosen.find({owner: Meteor.userId()}).count() ) {
        Meteor.call("updateVote", Chosen.findOne({owner: Meteor.userId()})._id, chosen_place);
        Meteor.call("updatePlaceCount", chosen_place, Chosen.find({chosen: chosen_place}).count());
      } else {
        Meteor.call("addVote", chosen_place);
      }
      Meteor.call("updateAllPlaceCount");
    }
  });

  Template.manage.helpers({
    isAdmin: function () {
      var user = Meteor.user();
      if (user && user.emails)
        return user.emails[0].address === 'wilson@wego.com';
    },

    listAllUsers: function () {
      return Meteor.users.find({}).fetch();
    },

    listAllPlaces: function () {
      return Places.find({}, {sort: {place: '1'}});
    },

    results: function () {
      return Chosen.find({}).count();
    }

  });

  Template.manage.events({
    'click .js-add-place': function(e){
      e.preventDefault();
      var newPlace = $('.add-place').val();
      if (newPlace) {
        Meteor.call("addPlace", newPlace);
        $('.add-place').val('');
      }
    },

    'click .js-add-user': function(e){
      e.preventDefault();
      var newUser = $('.add-user').val();
      if (newUser) {
        Meteor.call("addUser", newUser);
        $('.add-user').val('');
      }
    },

    'click .js-delete-place': function(e){
      e.preventDefault();
      Meteor.call("deletePlace", $(this)[0].place);
    },

    'click .js-reset-votes': function(e){
      e.preventDefault();
      Meteor.call("resetVotes");
    },

    'click .js-delete-user': function(e){
      e.preventDefault();
      Meteor.call("deleteUser", $(this)[0]._id);
    }
  });

  Router.route('/', function () {
    this.render('lunch');
  });

  Router.route('/m', function () {
    this.render('manage');
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.publish("allUsers", function() {
      return Meteor.users.find({}, {fields: {"emails.address": 1}});
    });

    Meteor.publish("allPlaces", function() {
      return Places.find({});
    });

    Meteor.publish("allVotes", function() {
      return Chosen.find({});
    });
  });

  Accounts.config({
    forbidClientAccountCreation: true
  });
}

Meteor.methods({
  addVote: function (chosen_place) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Chosen.insert({
      chosen: chosen_place,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },

  updateVote: function (chosenId, place) {
    Chosen.update(chosenId, { $set: {chosen: place} });
  },

  updatePlaceCount: function (placeName, totalCount) {
    Places.update({
      place: placeName
    }, {
      $set: {count: totalCount}
    });
  },

  updateAllPlaceCount: function () {
    var allPlaces = Places.find();
    return allPlaces.map(function (lugar) {
      Places.update({place: lugar.place}, { $set: {count: Chosen.find({chosen: lugar.place}).count()} });
    });
  },

  addPlace: function (newPlace) {
    Places.insert({
      place: newPlace,
      count: 0,
      createdAt: new Date()
    });
  },

  deletePlace: function (place) {
    Places.remove({ place: place });
  },

  resetVotes: function () {
    Chosen.remove({});
  },

  addUser: function (newUser) {
    Accounts.createUser({
      email : newUser,
      password : 'password'
    });
  },

  deleteUser: function (userId) {
    Meteor.users.remove({_id: userId});
  }
});
