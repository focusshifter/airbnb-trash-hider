// ==UserScript==
// @name         Airbnb Trash Listings Hider with Hide Button
// @namespace    https://raw.githubusercontent.com/Mayurifag/airbnb-trash-listings-hide-userscript/main/userscript.js
// @version      2024.11.10
// @description  Hide listings with low rating and low number of reviews on Airbnb search page. Adds a "hide" button to toggle visibility and saves the state. Based on https://github.com/Mayurifag/airbnb-trash-listings-hide-userscript
// @author       focusshifter, Mayurifag
// @match        https://www.airbnb.com/s/*
// @grant        none
// @license MIT
// ==/UserScript==

(function () {
  'use strict';

  const ratingPattern = /([\d.]+) \((\d+)\)/;
  const ratingThreshold = 4.5;
  const reviewCountThreshold = 5;

  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        const itemListElements = addedNodes.filter(node =>
          node.tagName === 'DIV' && node.getAttribute('itemprop') === 'itemListElement'
        );

        if (itemListElements.length > 0) {
          itemListElements.forEach((listing) => {
            // Extract the listing ID from the nested meta tag
            const metaUrl = listing.querySelector('meta[itemprop="url"]');
            if (!metaUrl) return;

            const urlContent = metaUrl.getAttribute('content');
            const listingIdMatch = urlContent.match(/rooms\/(\d+)/);
            if (!listingIdMatch) return;

            const listingId = listingIdMatch[1]; // Extracted ID
            const lines = listing.innerText.split('\n');
            const listingShortDescription = `${lines[0]} ${lines[1]}`;
            const lastLine = lines[lines.length - 1];
            const match = lastLine.match(ratingPattern);

            // Check if the listing has been manually hidden before (via localStorage)
            if (localStorage.getItem(`hiddenListing-${listingId}`)) {
              listing.style.opacity = 0.1; // Hide listing based on previous state
            } else if (match) {
              const rating = parseFloat(match[1]);
              const reviewCount = parseInt(match[2], 10);

              if (rating < ratingThreshold) {
                console.log(`${listingShortDescription} has low rating`);
                listing.style.opacity = 0.1;
              } else if (reviewCount < reviewCountThreshold) {
                console.log(`${listingShortDescription} has low review count`);
                listing.style.opacity = 0.2;
              }
            } else {
              console.log(`${listingShortDescription} has no rating and reviews`);
              listing.style.opacity = 0.1;
            }

            // Add the hide button to the listing
            addHideButton(listing, listingId);
          });
        }
      }
    });
  });

  observer.observe(document, { childList: true, subtree: true });

  // Function to add a hide button to the listing
  function addHideButton(listing, listingId) {
    // Check if button already exists
    if (listing.querySelector('.hide-listing-button')) return;

    const hideButton = document.createElement('button');
    hideButton.textContent = '✖';
    hideButton.style.position = 'absolute';
    hideButton.style.top = '15px';
    hideButton.style.right = '50px';

    if (listing.style.opacity === '0.1') {
      hideButton.style.backgroundColor = 'orange';
    } else {
      hideButton.style.backgroundColor = 'red';
    }
    hideButton.style.color = 'white';
    hideButton.style.border = 'none';
    hideButton.style.fontSize = '16px';
    hideButton.style.cursor = 'pointer';
    hideButton.style.zIndex = '9999';

    // Style the parent container of the listing to ensure button is visible
    listing.style.position = 'relative';

    // Handle button click to hide the listing and save the state
    hideButton.addEventListener('click', () => {
      if (listing.style.opacity === '0.1') {
        hideButton.style.backgroundColor = 'red';
        listing.style.opacity = 1; // Restore opacity if already hidden
        localStorage.removeItem(`hiddenListing-${listingId}`); // Remove from localStorage
        console.log(`Removed from localStorage: hiddenListing-${listingId}`);
      } else {
        hideButton.style.backgroundColor = 'orange';
        listing.style.opacity = 0.1; // Hide the listing
        localStorage.setItem(`hiddenListing-${listingId}`, 'true'); // Save state in localStorage
        console.log(`Saved to localStorage: hiddenListing-${listingId}`);
      }
    });

    // Add the button to the listing
    listing.appendChild(hideButton);
  }
})();
