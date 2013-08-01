if (!window.Mobile) Mobile = {};

/*
 *  The point of mobile storage is that we can do user-specific
 *    Storage if we need to. This will make sure variables will not
 *    overlap between users. user_id may be a number of a string.
 */

Mobile.Storage = new new Class({
  data: {},
  
  create_user: function(user_id) {
    if (!user_id && !Mobile.Storage.data[0]) 
	  this.data[0] = {};
	  
	if (user_id && !Mobile.Storage.data[user_id])
	  this.data[user_id] = {};
  },
  
  get_bin: function(user_id) {
    this.create_user(user_id);
	return user_id ? this.data[user_id] : this.data[0];
  },
  
  set: function(n,v, user_id) {
    this.get_bin(user_id)[n] = v;
  },
  
  get: function(n, user_id) {
    return this.get_bin(user_id)[n];
  },
  
  del: function(n, user_id) {
    delete this.get_bin(user_id)[n];
  },
  
  empty_user: function(user_id) {
    delete (user_id ? this.data[user_id] : this.data[0]);
  }
});


Mobile.Storage.Persistent = {};