"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  if (currentUser) {
      if (story.username === currentUser.username) {
        return $(`
        <li id="${story.storyId}"><span class="edit"></span><span class="waste"></span><span class="star" data-id="${story.storyId}"></span>
          <a href="${story.url}" target="a_blank" class="story-link">
            ${story.title}
          </a>
          <small class="story-hostname">(${story.getHostName()})</small>
          <small class="story-author">by ${story.author}</small>
          <small class="story-user">posted by ${story.username}</small>
        </li>
      `);
      } else {
        return $(`
        <li id="${story.storyId}"><span class="star" data-id="${story.storyId}"></span>
          <a href="${story.url}" target="a_blank" class="story-link">
            ${story.title}
          </a>
          <small class="story-hostname">(${story.getHostName()})</small>
          <small class="story-author">by ${story.author}</small>
          <small class="story-user">posted by ${story.username}</small>
        </li>
      `);
      }
  } else {
    return $(`
    <li id="${story.storyId}">
      <a href="${story.url}" target="a_blank" class="story-link">
        ${story.title}
      </a>
      <small class="story-hostname">(${story.getHostName()})</small>
      <small class="story-author">by ${story.author}</small>
      <small class="story-user">posted by ${story.username}</small>
    </li>
  `);
  }
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  //apply icons to stories that need them (everything gets a star)
  if (currentUser) {
    $('.edit').css('cursor', 'pointer').css('font-size', '20px').html('&#128393;');
    $('.waste').css('cursor', 'pointer').css('font-size', '20px').html('&#128465;'); //'&#128465;
    $('.star').css('cursor', 'pointer').css('font-size', '20px').html('&#10025;');
  

    //if a story is in favorites, then give it the filled in star html character.
    //if not, keep empty star assigned above
    console.log(context);
    if (context === 'navAllStories') {
      const favorites = currentUser.favorites;
      const kids = $('#all-stories-list .star');

      for (let x=0; x < favorites.length; x++ ) {
        for (const kid of kids) {
          if (favorites[x].storyId === $(kid).attr('data-id')) {
            $(kid).css('cursor', 'pointer').css('font-size', '20px').html('&#9733;');
            $(kid).toggleClass('favorite');
            break;
          }
        }
      }
    }
  
    //what happens when you click a star
    $('.star').on('click', makeUnmakeFavorite);

    //delete story
    $('.waste').on('click', deleteStory);

    //edit story. populate initial values
    $('.edit').on('click', editStory);
  }

  $allStoriesList.show();
}

async function editStory(e) {
  hidePageComponents();
  const editForm = $('#edit-form');
  editForm.show();
  const inputs = $('#edit-form input');
  const storyId = $(this).parent().attr('id');

  const myStory = storyList.stories.find(function(val) {
    return val.storyId === storyId;
  });

  inputs.eq(0).val(`${myStory.author}`);
  inputs.eq(1).val(`${myStory.title}`);
  inputs.eq(2).val(`${myStory.url}`);
  localStorage.setItem('id', storyId);
}

$('#edit-submit-button').on('click', async function() {
    const id = localStorage.getItem('id');
    console.log(id);
    localStorage.removeItem('id');
    const inputs = $('#edit-form input');
    const myStory = storyList.stories.find(function(val) {
      return val.storyId === id;
    });
    console.log(myStory);

    let author = (inputs.eq(0).val() === myStory.author || inputs.eq(1).val() === '') ? false : inputs.eq(0).val();
    let title = (inputs.eq(1).val() === myStory.title || inputs.eq(1).val() === '') ? false : inputs.eq(1).val();
    let url = (inputs.eq(2).val() === myStory.url || inputs.eq(2).val() === '') ? false : inputs.eq(2).val();
  
    console.log(author, title, url);
    if (!author && !title && !url) {
      const h1 = $('<h1 style="color:red;font-weight:bold;">There are no values to update. Change a value to try again.</h1>');
      $('#edit-form').append(h1);
      setTimeout(function() {
        h1.remove();
      }, 2000);
  
    } else {
      const story = {};
      if (author) story.author = author;
      if (title) story.title = title;
      if (url) story.url = url;
      console.log(story);
      const response = await axios.patch(BASE_URL+`/stories/${id}`, {"token": currentUser.loginToken, "story": story});
      console.log('before', myStory)
      //update story object w/o having to call API
      if (author) myStory.author = author;
      if (title) myStory.title = title;
      if (url) myStory.url = url;
      console.log('after', myStory);
  
      if (context === 'navFavorites') {
        putFavoritesOnPage();
      } else {
        putStoriesOnPage()
      }
      inputs.val('');
      $('#edit-form').hide();
    }
  });

async function handleNewStorySubmission(e) {
  e.preventDefault();
  const inputs = $('#story-form input')
  const params = {"title": inputs.eq(0).val(), "author": inputs.eq(1).val(), "url": inputs.eq(2).val()};
  inputs.val('');
  $('#story-form').toggleClass('hidden');
  const newStory = await storyList.addStory(currentUser.loginToken, params);
  storyList.stories.unshift(newStory);
  putStoriesOnPage();
}

//submit new story
$('#submit-button').on('click', handleNewStorySubmission);