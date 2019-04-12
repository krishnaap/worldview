import React from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';

import TimeScaleIntervalChange from './timeline-controls/interval-timescale-change';
import './timeline.css';
import TimelineAxisContainer from './timeline-axis/timeline-axis-container';
import CustomIntervalSelectorWidget from './interval-selector/interval-selector';

import DateSelector from '../date-selector/date-selector';
import DateChangeArrows from './timeline-controls/date-change-arrows';
import AnimationButton from './timeline-controls/animation-button';

import AxisTimeScaleChange from './timeline-controls/axis-timescale-change';

const timeUnitAbbreviations = {
  year: 'year',
  month: 'mon',
  day: 'day',
  hour: 'hour',
  minute: 'min'
};

class Timeline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      customSelected: '',
      compareModeActive: '',
      dateFormatted: '',
      dateFormattedB: '',
      axisWidth: '',
      selectedDate: '',
      changeDate: '',
      timeScale: '',
      incrementDate: '',
      timeScaleChangeUnit: '',
      intervalText: '',
      customIntervalValue: '',
      customIntervalZoomLevel: '',
      // customIntervalText: '',
      intervalChangeAmt: '',
      hasSubdailyLayers: '',
      customIntervalModalOpen: false,
      timelineHidden: false,
      parentOffset: ''
    };
  }

  updateDate = (date, selectionStr) => {
      this.props.updateDate(date, selectionStr);
  }

  // show/hide custom interval modal
  toggleCustomIntervalModal = () => {
    this.setState(prevState => ({
      customIntervalModalOpen: !prevState.customIntervalModalOpen
    }));
  }

  // Change the timescale parent state
  changeTimescale = (timeScale) => {
    if (this.state.timeScale !== timeScale) {
      this.props.changeTimeScale(timeScale);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log(this.state.dateFormatted, prevState.dateFormatted)
    // if(this.state.dateFormatted !== prevState.dateFormatted) {
    //   this.setState({
    //     dateFormatted: this.props.dateFormatted
    //   })
    // }
  }

  componentDidMount() {
    this.init();
  }

  init = () => {
    let timeScaleChangeUnitString = `${this.props.intervalDelta} ${timeUnitAbbreviations[this.props.intervalTimeScale]}`;
    this.setState({
      dateFormatted: this.props.selectedDate.toISOString(),
      dateFormattedB: this.props.selectedDateB ? this.props.selectedDateB.toISOString() : null,
      draggerSelected: this.props.draggerSelected,
      axisWidth: this.props.axisWidth,
      selectedDate: this.props.selectedDate.toISOString(),
      changeDate: this.props.changeDate,
      timeScale: this.props.timeScale,
      incrementDate: this.props.incrementDate,
      timeScaleChangeUnit: this.props.intervalTimeScale,
      customIntervalValue: this.props.intervalDelta,
      intervalChangeAmt: this.props.intervalDelta,
      customIntervalZoomLevel: this.props.customIntervalZoomLevel,
      hasSubdailyLayers: this.props.hasSubdailyLayers,
      intervalText: this.props.timeScale,
      compareModeActive: this.props.compareModeActive,
      customSelected: this.props.customSelected,
      parentOffset: this.props.parentOffset
    });
  }

  // handle SET of custom time scale panel
  setIntervalChangeUnit = (intervalValue, zoomLevel) => {
    this.props.setIntervalInput(intervalValue, zoomLevel)
  }

  // handle SELECT of LEFT/RIGHT interval selection
  setTimeScaleIntervalChangeUnit = (intervalSelected, customSelected) => {
    console.log('select', intervalSelected, customSelected)
    let intervalChangeAmt;
    if (intervalSelected === 'custom') {
      intervalSelected = this.state.customIntervalZoomLevel;
      intervalChangeAmt = this.state.customIntervalValue;
    } else {
      intervalChangeAmt = 1;
    }
    this.props.setSelectedInterval(intervalSelected, intervalChangeAmt, customSelected);
  }

  // left/right arrows increment date
  incrementDate = (multiplier) => {
    let draggerSelected = this.state.draggerSelected;
    let dateSelected = draggerSelected === 'selected' ? this.state.dateFormatted : this.state.dateFormattedB;
    console.log(draggerSelected, dateSelected)
    let newDate = moment.utc(dateSelected).add((multiplier * this.state.intervalChangeAmt), this.state.timeScaleChangeUnit)
    console.log(this.state.draggerSelected, this.state.dateFormatted, this.state.dateFormattedB, newDate)
    this.updateDate(new Date(newDate.format()), draggerSelected);
  }

  // open animation dialog
  clickAnimationButton = () => {
    this.props.clickAnimationButton();
  }

  // toggle hide timeline
  toggleHideTimeline = () => {
    this.setState({
      timelineHidden: !this.state.timelineHidden
    }, this.props.toggleHideTimeline());
  }

  shouldComponentUpdate(nextProps, nextState) {
    // console.log(this.props, nextProps, this.state, nextState)
    return true;
  }

  render() {
    // console.log(this.props.selectedDate, this.props.dateFormatted, this.state.dateFormatted, this.props)
    // console.log(this.state)
    // console.log(this.props.hasSubdailyLayers, this.state.hasSubdailyLayers)
    // console.log(this.props)
    // console.log(this.state.draggerSelected)
    return (
      this.state.dateFormatted ?
      <React.Fragment>
        <div id="timeline-header" className={this.state.hasSubdailyLayers ? 'subdaily' : ''}>
          <div id="date-selector-main">
            <DateSelector
              {...this.props}
              onDateChange={this.updateDate}
              date={new Date(this.state.dateFormatted)}
              dateB={new Date(this.state.dateFormattedB)}
              hasSubdailyLayers={this.state.hasSubdailyLayers}
              draggerSelected={this.state.draggerSelected}
            />
          </div>
          <div id="zoom-buttons-group">
            <TimeScaleIntervalChange
              setTimeScaleIntervalChangeUnit={this.setTimeScaleIntervalChangeUnit}
              // intervalText={this.state.intervalText}
              // customIntervalText={this.state.customIntervalText}
              customIntervalZoomLevel={this.state.customIntervalZoomLevel}
              customSelected={this.state.customSelected}
              customIntervalValue={this.state.customIntervalValue}
              timeScaleChangeUnit={this.state.timeScaleChangeUnit}
            />

            {/* custom interval selector */}
            <CustomIntervalSelectorWidget
              customIntervalValue={this.state.customIntervalValue}
              customIntervalZoomLevel={this.state.customIntervalZoomLevel}
              toggleCustomIntervalModal={this.toggleCustomIntervalModal}
              customIntervalModalOpen={this.state.customIntervalModalOpen}
              setIntervalChangeUnit={this.setIntervalChangeUnit}
              hasSubdailyLayers={this.state.hasSubdailyLayers}
            />

            <DateChangeArrows
              leftArrowDown={() => this.incrementDate(-1)}
              leftArrowUp={this.props.stopper}
              rightArrowDown={() => this.incrementDate(1)}
              rightArrowUp={this.props.stopper}
            />
          </div>

          <AnimationButton
            clickAnimationButton={this.clickAnimationButton}
          />
        </div>
        <div id="timeline-footer">
          <div id="wv-animation-widet-case"> </div>
          {/* <svg width="1207" height="107" id="timeline-footer-svg" viewBox="0 9 1207 91"> */}
          {/* new modular version - currently a shell */}
            <TimelineAxisContainer
              {...this.state}
              axisWidth={this.state.axisWidth}
              selectedDate={this.state.dateFormatted}
              selectedDateB={this.state.dateFormattedB}
              updateDate={this.updateDate}
              hasSubdailyLayers={this.state.hasSubdailyLayers}
              parentOffset={this.state.parentOffset}
              changeTimescale={this.changeTimescale}
              compareModeActive={this.state.compareModeActive}
              draggerSelected={this.state.draggerSelected}
              onChangeSelectedDragger={this.props.onChangeSelectedDragger}
            />
            {/* </svg> */}
        </div>

        {/* hammmmmmmmmmmburger 🍔 */}
        <div className="zoom-level-change" style={{ width: '75px', display: this.state.timelineHidden ? 'none' : 'block'}}>
          <AxisTimeScaleChange
          timeScale={this.state.timeScale}
          changeTimescale={this.changeTimescale}
          hasSubdailyLayers={this.state.hasSubdailyLayers}
          />
        </div>

        <div id="timeline-hide" onClick={this.toggleHideTimeline}>
          {this.state.timelineHidden ?
          <i className="fas fa-chevron-right wv-timeline-hide-arrow"></i>
          :
          <i className="fas fa-chevron-left wv-timeline-hide-arrow"></i>
          }
        </div>
      </React.Fragment>
      :
      null
    );
  }
}
// Timeline.defaultProps = {
// };
// Timeline.propTypes = {
//   width: PropTypes.number,
//   drawContainers: PropTypes.func,
//   changeDate: PropTypes.func,
//   selectedDate: PropTypes.instanceOf(Date)
// };

export default Timeline;
