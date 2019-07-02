import {
  CHANGE_TIME_SCALE,
  CHANGE_CUSTOM_INTERVAL,
  CHANGE_INTERVAL,
  SELECT_DATE,
  UPDATE_APP_NOW
} from './constants';
import util from '../../util/util';
import { assign as lodashAssign } from 'lodash';

export const dateReducerState = {
  selectedZoom: 3,
  interval: 3,
  delta: 1,
  customSelected: false,
  customDelta: undefined,
  customInterval: undefined,
  testNow: undefined
};

export function getInitialState(config) {
  return lodashAssign({}, dateReducerState, {
    selected: config.pageLoadTime,
    selectedB: util.dateAdd(config.pageLoadTime, 'day', -7),
    appNow: config.pageLoadTime
  });
}

export function dateReducer(state = dateReducerState, action) {
  switch (action.type) {
    case CHANGE_TIME_SCALE:
      return lodashAssign({}, state, {
        selectedZoom: action.value
      });
    case CHANGE_CUSTOM_INTERVAL:
      return lodashAssign({}, state, {
        customInterval: action.value,
        customDelta: action.delta,
        customSelected: true
      });
    case CHANGE_INTERVAL:
      return lodashAssign({}, state, {
        interval: action.value,
        delta: action.delta,
        customSelected: action.customSelected
      });
    case SELECT_DATE:
      return lodashAssign({}, state, {
        [action.activeString]: action.value
      });
    case UPDATE_APP_NOW:
      return lodashAssign({}, state, {
        appNow: action.value
      });
    default:
      return state;
  }
}
