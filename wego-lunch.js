Places = new Mongo.Collection("places");
Chosen = new Mongo.Collection("chosen");

if (Meteor.isClient) {
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
    }
  });

  Template.manage.events({
    // manage event here
  });

  Router.route('/', function () {
    this.render('lunch');
  });

  Router.route('/m', function () {
    this.render('manage');
  });

  Accounts.config({
    forbidClientAccountCreation: true
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
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
  }
});
