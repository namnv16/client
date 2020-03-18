import buildThread from '../build-thread';
import events from '../events';
import * as metadata from '../util/annotation-metadata';
import memoize from '../util/memoize';
import * as tabs from '../util/tabs';

function truthyKeys(map) {
  return Object.keys(map).filter(function(k) {
    return !!map[k];
  });
}

// Mapping from sort order name to a less-than predicate
// function for comparing annotations to determine their sort order.
const sortFns = {
  Newest: function(a, b) {
    return a.updated > b.updated;
  },
  Oldest: function(a, b) {
    return a.updated < b.updated;
  },
  Location: function(a, b) {
    return metadata.location(a) < metadata.location(b);
  },
};

/**
 * Root conversation thread for the sidebar and stream.
 *
 * This performs two functions:
 *
 * 1. It listens for annotations being loaded, created and unloaded and
 *    dispatches store.{addAnnotations|removeAnnotations} actions.
 * 2. Listens for changes in the UI state and rebuilds the root conversation
 *    thread.
 *
 * The root thread is then displayed by viewer.html
 */
// @ngInject
export default function RootThread(
  $rootScope,
  annotationsService,
  store,
  searchFilter,
  viewFilter
) {
  /**
   * Build the root conversation thread from the given UI state.
   *
   * @param state - The current UI state (loaded annotations, sort mode,
   *        filter settings etc.)
   */
  function buildRootThread(state) {
    const sortFn = sortFns[state.selection.sortKey];
    const shouldFilterThread = () => {
      // Is there a search query, or are we in an active (focused) focus mode?
      return state.selection.filterQuery || store.focusModeFocused();
    };
    let filterFn;
    if (shouldFilterThread()) {
      const filters = searchFilter.generateFacetedFilter(
        state.selection.filterQuery,
        {
          // if a focus mode is applied (focused) and we're focusing on a user
          user: store.focusModeFocused() && store.focusModeUserId(),
        }
      );

      filterFn = function(annot) {
        return viewFilter.filter([annot], filters).length > 0;
      };
    }

    let threadFilterFn;
    if (state.route.name === 'sidebar' && !shouldFilterThread()) {
      threadFilterFn = function(thread) {
        if (!thread.annotation) {
          return false;
        }

        return tabs.shouldShowInTab(
          thread.annotation,
          state.selection.selectedTab
        );
      };
    }

    // Get the currently loaded annotations and the set of inputs which
    // determines what is visible and build the visible thread structure
    return buildThread(state.annotations.annotations, {
      forceVisible: truthyKeys(state.selection.forceVisible),
      expanded: state.selection.expanded,
      highlighted: state.selection.highlighted,
      selected: truthyKeys(state.selection.selectedAnnotationMap || {}),
      sortCompareFn: sortFn,
      filterFn: filterFn,
      threadFilterFn: threadFilterFn,
    });
  }

  // Listen for annotations being created or loaded
  // and show them in the UI.
  //
  // Note: These events could all be converted into actions that are handled by
  // the Redux store in store.
  const loadEvents = [
    events.ANNOTATION_CREATED,
    events.ANNOTATION_UPDATED,
    events.ANNOTATIONS_LOADED,
  ];
  loadEvents.forEach(function(event) {
    $rootScope.$on(event, function(event, annotation) {
      store.addAnnotations([].concat(annotation));
    });
  });

  $rootScope.$on(events.BEFORE_ANNOTATION_CREATED, function(event, ann) {
    annotationsService.create(ann);
  });

  // Remove any annotations that are deleted or unloaded
  $rootScope.$on(events.ANNOTATION_DELETED, function(event, annotation) {
    store.removeAnnotations([annotation]);
  });

  /**
   * Build the root conversation thread from the given UI state.
   * @return {Thread}
   */
  this.thread = memoize(buildRootThread);
}
