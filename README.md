# Anigrid

### Sleek, minimalist anime ranker/tier list thoroughly optimized for anime fans

> WIP: Readme in construction

### TODOs:

- image download does not work, returning some error i suspect to be related to trust environment. html-to-image always acting up in every frontend hook for some reason
- the panel doesn't reopen after successful drops, but I assume that should be trivial. The width of the collapsed bottom panel should be smaller though, as i would like to see its sides, and it should only widen when the height expands. that way it feels elastic too.
- touch based drag-and-drop events should also be acknowledged; they currently don't work on
  mobile
- on expand on mobile, the 'Library' text isn't necessary if we have the icon, just to manage screen real estate. I find it a bit inane how there's no cell aspect ratio option present.
- I should also additional improvements to UI and tactile feel. on empty states for grid cells and list, if one presses the empty cells '+ Add', a dropdown/popover should float down iOS style with the options to source locally or to search, or to use a url. on mobile, since we cant hover over items,i should ensure that the user taps an image or perhaps longpresses on the grid/list (ensuring that they dont intend to swap positions with another item), a dropdown of options i'd get from hovering appears for them (crop and adjust, remove etc)
- have the 'x' icon persistently present on images in the Inbox panel for mobile accessibility
- empty state for collection has two redudant service areas: a drag item area and an upload button. i could make better spacing for them if they were unified.
- empty states across application should have tiny vector anime characters so it stops feeling like Notion 2 (no fucking clue how i'll approach that, but ill ge there)
- animation entrances for microinteractions in the inbox such as clicking the '+' button, the slider for the appearance card should display proper progress, data actions in the sidepanel should have an accurate positioning of the dividers between them. restore button also isn't functional, there's no option to change the background color of the ranking card in the sidepanel
