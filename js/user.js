"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */

/** Handle login form submission. If login ok, sets up the user instance */

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();

  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.login(username, password);

  $loginForm.trigger("reset");

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();
}

$loginForm.on("submit", login);

/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  try {
    currentUser = await User.signup(username, password, name);
  } catch (err) {
    const span = $('<span id="errormsg" style="color:red;font-weight:bold;">Username already taken. Please try again</span>');
    const x = $('#signup-username').parent().append(span);

    setTimeout(function() {
      $('#errormsg').remove();
      $('.login-input input').val('');
    }, 2000);
  }

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();

  $signupForm.trigger("reset");
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  location.reload();
}

$navLogOut.on("click", logout);


function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");
  $allStoriesList.empty();

  for (const fav of currentUser.favorites) {
    const $story = generateStoryMarkup(fav);
    $allStoriesList.append($story);
  }

  $('.edit').css('cursor', 'pointer').css('font-size', '20px').html('&#128393;');
  $('.waste').css('cursor', 'pointer').css('font-size', '20px').html('&#128465;');
  $('.star').css('cursor', 'pointer').css('font-size', '20px').html('&#9733;');
  $('.star').toggleClass('favorite');
  //what happens when you click a star
  $('.star').on('click', makeUnmakeFavorite);

  //delete story
  $('.waste').on('click', deleteStory);

  //edit story. populate initial values
  $('.edit').on('click', editStory);

  $allStoriesList.show();
}

//Handle click of 'star' to make story a favorite
//make API post request to update user favorites info

async function makeUnmakeFavorite(e) {
  const id = $(this).attr('data-id');
  let response;

  //unfilled star --> filled star. call post
  if (!$(this).hasClass('favorite')) {
      console.log('clicking on unfilled star');
      response = await axios.post(BASE_URL+`/users/${currentUser.username}/favorites/${id}`, {"token": currentUser.loginToken});
      $(this).html('&#9733;');
      $(this).toggleClass('favorite');
      console.log(currentUser);
      currentUser.favorites.push(storyList.stories.find(function(val) {
        return val.storyId === id;
      }));      
      console.log(currentUser.favorites);

  //filled star --> unfilled star. call delete
  } else {
      console.log('clicking on filled star');
      console.log($(this).hasClass('favorite'));
      response = await axios.delete(BASE_URL+`/users/${currentUser.username}/favorites/${id}`, {"data": {"token": currentUser.loginToken}});
      $(this).html('&#10025;');
      $(this).toggleClass('favorite');
      if (context === 'navFavorites') {
        $(this).parent().remove();
      }
      console.log(currentUser.favorites);
      currentUser.favorites = currentUser.favorites.filter(function(val) {
        return val.storyId !== id;
      });
      console.log(currentUser.favorites);

  }
  console.debug(response);
}

async function deleteStory(e) {
  const id = $(this).parent().attr('id');

  const response = await axios.delete(BASE_URL+`/stories/${id}`, {"data": {"token": currentUser.loginToken}});
  $($(this).parent()).remove();

  storyList.stories = storyList.stories.filter(function(val) {
    return val.storyId !== id;
  });

  currentUser.favorites = currentUser.favorites.filter(function(val) {
    return val.storyId !== id;
  });

  /*currentUser.ownStories = currentUser.ownStories.filter(function(val) {
    return val.storyId !== id;
  })*/
  console.log(response);
}

/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");

  $allStoriesList.show();

  updateNavOnLogin();
}
