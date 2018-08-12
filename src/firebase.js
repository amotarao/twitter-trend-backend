'use strict';

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

const tweetsRef = db.collection('tweets');
const twUsersRef = db.collection('tw_users');
const listsRef = db.collection('lists');

class firebase {
  /**
   * 複数のツイートを記録する
   * @param {Array} tweets ツイート
   * @param {Boolean} saveUser 付帯するユーザー情報を記録するかどうか
   */
  static setTweets(tweets, saveUser = true) {
    let users = [];
    for (let i = 0; i < tweets.length; i++) {
      this.setTweet(tweets[i], false);
      users.push(tweets[i].user);
    }

    if (!saveUser) return;

    /** 重複ユーザーの削除 */
    users = users.filter((x1, i, self) => {
      return self.findIndex(x2 => x1.id === x2.id) === i;
    });
    this.setTwUsers(users);
  }

  /**
   * ツイートを記録する
   * @param {Object[]} tweet ツイート
   * @param {Boolean} saveUser 付帯するユーザー情報を記録するかどうか
   */
  static setTweet(tweet, saveUser = true) {
    const data = {
      id: tweet.id,
      id_str: tweet.id_str,
      text: tweet.text,
      create_at: new Date(tweet.created_at),
      update_at: new Date(),
      favorite_count: tweet.favorite_count,
      retweet_count: tweet.retweet_count,
      is_retweet: Boolean('retweeted_status' in tweet),
      is_reply: Boolean(tweet.in_reply_to_screen_name),
      user_ref: twUsersRef.doc(tweet.user.id_str)
    };

    tweetsRef.doc(tweet.id_str).set(data);

    if (!saveUser) return;
    this.setTwUser(tweet.user);
  }

  /**
   * 複数のTwitterユーザーを記録する
   * @param {Object[]} users ユーザー
   */
  static setTwUsers(users) {
    for (let i = 0; i < users.length; i++) {
      this.setTwUser(users[i]);
    }
  }

  /**
   * Twitterユーザーを記録する
   * @param {Object} user ユーザー
   */
  static setTwUser(user) {
    const data = {
      id: user.id,
      id_str: user.id_str,
      name: user.name,
      screen_name: user.screen_name,
      create_at: new Date(user.created_at),
      update_at: new Date(),
      followers_count: user.followers_count,
      friends_count: user.friends_count,
      profile_image_url: user.profile_image_url,
      profile_image_url_https: user.profile_image_url_https,
    };

    twUsersRef.doc(user.id_str).set(data);
  }

  /**
   * ユーザーを取得する
   * @param {String} id ユーザーID
   */
  static async getTwUserFromID(id) {
    try {
      return (await twUsersRef.doc(id).get()).data();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * ユーザーを取得する
   * @param {*} userRef ユーザー
   */
  static async getTwUser(userRef) {
    try {
      return (await userRef.get()).data();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * ユーザーを取得する
   * 最終更新日が古い順に100件取得
   */
  static async getTwUsersOrderByOlder() {
    try {
      const arr = [];
      const tweets = await twUsersRef.orderBy('update_at').limit(100).get();
      tweets.forEach(doc => {
        arr.push(doc.data());
      });
      return arr;
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * 指定したリストに入っているユーザーを取得する
   * @param {String} id リストID
   */
  static async getTwUsersFromList(id) {
    try {
      return (await listsRef.doc(id).get()).data();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * ユーザーのツイートを取得する
   * @param {*} userRef ユーザー
   */
  static async getTweetsFromUser(userRef) {
    try {
      const obj = {};
      const tweets = await tweetsRef.where('user_ref', '==', userRef).get();
      tweets.forEach(doc => {
        obj[doc.id] = doc.data();
      });
      return obj;
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = firebase;
