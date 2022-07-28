"use strict";
let context;
/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  context = "navAllStories";
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  navAllStories();
  $('.nav-center').show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
  
}

$('#nav-story-form').on('click', function(e) {
  $('#story-form').toggleClass('hidden');
});

function filterFavorites(e) {
  context = "navFavorites";
  hidePageComponents();
  putFavoritesOnPage();
}
 
$('#nav-favorites').on('click', filterFavorites);

function showUpdateProfile(e) {
  context = 'navProfile';
  hidePageComponents();
  const userForm = $('#user-form');
  userForm.show();

}

$('#nav-user-profile').on('click', showUpdateProfile);

$('#user-submit-button').on('click', async function(e) {
  const name = $("#change-name");
  const password = $("#change-password");
  const confirmPassword = $("#confirm-password");

  if ((password.val() !== '' || confirmPassword.val() !== '') && password.val() !== confirmPassword.val() && currentUser.name === name.val()) {
    const h1 = $('<h1 style="color:red;font-weight:bold;">Both passwords must match and New name is the same as your current name. Please try again</h1>');
    $('#user-form').append(h1);
    setTimeout(function() {
      h1.remove();
      password.val('');
      confirmPassword.val('');
    }, 2000);
  } else if ((password.val() !== '' || confirmPassword.val() !== '') && password.val() !== confirmPassword.val()) {
    const h1 = $('<h1 style="color:red;font-weight:bold;">Both passwords must match. Please try again</h1>');
    $('#user-form').append(h1);
    setTimeout(function() {
      h1.remove();
      password.val('');
      confirmPassword.val('');
    }, 2000);
  } else if (currentUser.name === name.val()) {
    const h1 = $('<h1 style="color:red;font-weight:bold;">New name is the same as your current name. Please try again</h1>');
    $('#user-form').append(h1);
    setTimeout(function() {
      h1.remove();
      password.val('');
      confirmPassword.val('');
    }, 2000);
  } else {
    const user = {};
    if (name.val() !== '') user.name = name.val();
    if (password.val() !== '') user.password = password.val();

    const response = await axios.patch(BASE_URL+`/users/${currentUser.username}`, {"token": currentUser.loginToken, "user": user});
    console.log(response);
    if (response.data.status === 200 && password.val() !== '') {
      alert('password successfully updated!');
    }

    $('#user-form input').val('');
    $('#user-form').hide();

    navAllStories();

  }

});