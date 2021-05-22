/**
 * @author - Vikram
 */
var React = require("react");
var ReactDOM = require("react-dom");
//var EventEmitter = require('events').EventEmitter;
var RecordSummaryStore = require("../../stores/RecordSummaryStore");
var common = require("../common.jsx");
var genericView = require("./genericView.jsx");
var ActionCreator = require("../../actions/ActionCreator.js");
var SchemaStore = require("../../stores/SchemaStore");
//var WebUtils=require('../../utils/WebAPIUtils.js');
var global = require("../../utils/global.js");

Date.prototype.getFullMonthName = function() {
  var currDate = this;
  return currDate.monthNames[currDate.getMonth()];
};
Date.prototype.getMonthName = function() {
  var currDate = this;
  return currDate.months[currDate.getMonth()];
};
Date.prototype.months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
Date.prototype.monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
var defaultData = {};
defaultData.view = "Month";

/*
 *
 * Time format
 * Source: https://en.wikipedia.org/wiki/ISO_8601#Time_offsets_from_UTC
 */

var Cal = React.createClass({
  getInitialState: function() {
    var records = this.props.records;
    var toDay = new Date();
    console.log("cal initial state");
    var schema = SchemaStore.getSchema(this.props.schema);
    var startKey, endKey;
    if (
      schema &&
      schema["@operations"] &&
      schema["@operations"].read &&
      schema["@operations"].read.getSummary &&
      schema["@operations"].read.getSummary.viewType &&
      schema["@operations"].read.getSummary.viewType == "calendar" &&
      schema["@operations"].read.getSummary.start
    ) {
      startKey = schema["@operations"].read.getSummary.start;
    }
    if (
      schema &&
      schema["@operations"] &&
      schema["@operations"].read &&
      schema["@operations"].read.getSummary &&
      schema["@operations"].read.getSummary.viewType &&
      schema["@operations"].read.getSummary.viewType == "calendar" &&
      schema["@operations"].read.getSummary.end
    ) {
      endKey = schema["@operations"].read.getSummary.end;
    }
    var moment = {
      todayYear: toDay.getFullYear(),
      todayMonth: toDay.getFullMonthName(),
      today: toDay.getDate(),
      moment: toDay,
      num: toDay.getMonth() + 1,
      name: toDay.getFullMonthName(),
      year: toDay.getFullYear(),
      records: [],
      totalRecords: {}
    };

    if (this.props.filters && this.props.filters.dateModified) {
      var month = this.props.filters.dateModified[0].slice(-2) * 1;
      var year = this.props.filters.dateModified[0].slice(0, -2) * 1;
      moment.num = month;
      moment.year = year;
      moment.name = new Date(year, month - 1).getFullMonthName();
      moment.records = RecordSummaryStore.getSchemaRecords({
        schema: this.props.rootSchema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      });
    }

    if (this.props.records && this.props.records.length > 0) {
      var fMonths = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ];
      var record = this.props.records[0].value;
      var day = record[startKey].split(" ")[0].split("-");

      var month = Date.prototype.months.indexOf(day[1]); //record[startKey].slice(-2)*1;
      //console.log("month: "+month);
      var year = day[2] * 1; //record.dateModified.slice(0,-2)*1;

      moment.num = month;
      moment.year = year;
      moment.name = new Date(year, month - 1).getFullMonthName();
      moment.records = this.props.records;
    }
    var selectedDay = {
      year: null,
      month: null,
      num: null,
      tasks: [],
      occasions: []
    };
    if (Object.keys(moment.totalRecords).length == 0) {
      /*
				moment.totalRecords = records;
				var startMonth = (Object.keys(records).sort()[0])*1;
				moment.num = startMonth+1; //This is to display initial month
				moment.year = records[startMonth][0].dt.getFullYear();// This is to display initial year
				moment.name = records[startMonth][0].dt.getFullMonthName();// This is to display the month name format
				moment.records = records[startMonth];
				*/
    }

    return {
      moment: moment,
      selectedDay: selectedDay
    };
  },
  render: function() {
    console.log("Cal:render");
    console.log(this.props);
    var self = this;
    var view;
    var self = this;
    var schema = SchemaStore.getSchema(this.props.schema);
    var startKey, endKey;
    if (
      schema &&
      schema["@operations"] &&
      schema["@operations"].read &&
      schema["@operations"].read.getSummary &&
      schema["@operations"].read.getSummary.viewType &&
      schema["@operations"].read.getSummary.viewType == "calendar" &&
      schema["@operations"].read.getSummary.start
    ) {
      startKey = schema["@operations"].read.getSummary.start;
    }
    if (
      schema &&
      schema["@operations"] &&
      schema["@operations"].read &&
      schema["@operations"].read.getSummary &&
      schema["@operations"].read.getSummary.viewType &&
      schema["@operations"].read.getSummary.viewType == "calendar" &&
      schema["@operations"].read.getSummary.end
    ) {
      endKey = schema["@operations"].read.getSummary.end;
    }
    if (defaultData.view == "Week") {
      view = (
        <WeekView
          moment={self.state.moment}
          weekDays={defaultData.weekDays}
          schema={self.props.schema}
          org={self.props.org}
          rootSchema={self.props.rootSchema}
          dependentSchema={self.props.dependentSchema}
          filters={this.props.filters}
          startKey={startKey}
          endKey={endKey}
        />
      );
    } else if (defaultData.view == "Day") {
      view = (
        <DayView
          moment={self.state.moment}
          day={defaultData.day}
          records={self.props.records}
          schema={self.props.schema}
          org={self.props.org}
          rootSchema={self.props.rootSchema}
          dependentSchema={self.props.dependentSchema}
          filters={self.props.filters}
          startKey={startKey}
          endKey={endKey}
        />
      );
    }
    if (defaultData.view == "Month") {
      view = (
        <Month
          moment={self.state.moment}
          selectedDay={self.state.selectedDay}
          records={self.props.records}
          schema={self.props.schema}
          org={self.props.org}
          rootSchema={self.props.rootSchema}
          dependentSchema={self.props.dependentSchema}
          filters={self.props.filters}
          startKey={startKey}
          endKey={endKey}
        />
      );
    }
    return (
      <div className="row" id="app">
        <div id="defaultView">{view}</div>
      </div>
    );
  },
  myDate: function() {
    new Date().getFullMonthName();
  }
});

var Month = React.createClass({
  getInitialState: function() {
    console.log("Month:getInitialState");
    var self = this;
    var startKey = self.props.startKey;
    if (!startKey) {
      var schema = SchemaStore.getSchema(this.props.schema);
      if (
        schema &&
        schema["@operations"] &&
        schema["@operations"].read &&
        schema["@operations"].read.getSummary &&
        schema["@operations"].read.getSummary.viewType &&
        schema["@operations"].read.getSummary.viewType == "calendar" &&
        schema["@operations"].read.getSummary.start
      ) {
        startKey = schema["@operations"].read.getSummary.start;
      }
    }
    var endKey = self.props.endKey;
    if (!endKey) {
      var schema = SchemaStore.getSchema(this.props.schema);
      if (
        schema &&
        schema["@operations"] &&
        schema["@operations"].read &&
        schema["@operations"].read.getSummary &&
        schema["@operations"].read.getSummary.viewType &&
        schema["@operations"].read.getSummary.viewType == "calendar" &&
        schema["@operations"].read.getSummary.start
      ) {
        endKey = schema["@operations"].read.getSummary.end;
      }
    }
    var records = self.props.records;
    if (records && records.length > 0) {
      for (var count = 0; count < records.length; count++) {
        var record = records[count].value;
        var day = record[startKey].split(" ")[0].split("-");
        var time = record[startKey].split(" ")[1].split(":");

        var month = Date.prototype.months.indexOf(day[1]);
        var year = day[2] * 1;
        records[count].dt = new Date(year, month, day[0], time[0], time[1]);
      }
      self.props.moment.records = records;
    } else {
      ActionCreator.getSchemaRecords({
        schema: this.props.rootSchema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      });
      self.props.moment.records = RecordSummaryStore.getSchemaRecords({
        schema: this.props.rootSchema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      });
    }

    return {
      moment: self.props.moment,
      selectedDay: self.props.selectedDay,
      records: self.props.records
    };
  },
  updateMonth: function(update) {
    console.log("Month:updateMonth");
    var self = this;
    var stateMoment = self.state.moment;
    var moment = {
      todayYear: stateMoment.todayYear,
      todayMonth: stateMoment.todayMonth,
      today: stateMoment.today,
      moment: stateMoment.moment,
      num: stateMoment.num,
      name: stateMoment.name,
      year: stateMoment.year,
      records: stateMoment.records,
      totalRecords: stateMoment.totalRecords
    };

    var newMonth = moment.num + update;

    if (newMonth == 0) {
      moment.year -= 1;
      moment.num = 12;
      moment.moment = new Date(moment.year, moment.num - 1);
      moment.name = moment.moment.getFullMonthName();
      //moment.records = moment.totalRecords[moment.num-1]?moment.totalRecords[moment.num-1]:[];
    } else if (newMonth == 13) {
      moment.year += 1;
      moment.num = 1;
      moment.moment = new Date(moment.year, moment.num - 1);
      moment.name = moment.moment.getFullMonthName();
      //moment.records = moment.totalRecords[moment.num-1]?moment.totalRecords[moment.num-1]:[];
    } else {
      moment.num += update;
      moment.moment = new Date(moment.year, moment.num - 1);
      moment.name = moment.moment.getFullMonthName();
      //moment.records = moment.totalRecords[moment.num-1]?moment.totalRecords[moment.num-1]:[];
    }

    if (!this.props.filters) {
      this.props.filters = {};
    }
    //console.log(this.props.filters);
    this.props.filters.dateModified = [
      "" + moment.year + ("0" + moment.num).slice(-2)
    ];
    //console.log(this.props.filters);
    //console.log(moment);
    moment.records = RecordSummaryStore.getSchemaRecords({
      schema: this.props.rootSchema,
      filters: this.props.filters,
      dependentSchema: this.props.dependentSchema,
      org: this.props.org,
      userId: common.getUserDoc().recordId
    });
    ActionCreator.getSchemaRecords({
      schema: this.props.rootSchema,
      filters: this.props.filters,
      dependentSchema: this.props.dependentSchema,
      org: this.props.org,
      userId: common.getUserDoc().recordId
    });
    console.log("Store Records:");
    console.log(moment.records);
    this.setState({
      moment: moment,
      records: RecordSummaryStore.getSchemaRecords({
        schema: this.props.rootSchema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      })
    });
  },
  _onChange: function() {
    console.log("Month:_onChange");
    //console.log("Month:props");
    //console.log(this.props);
    var moment = this.state.moment;
    moment.records = RecordSummaryStore.getSchemaRecords({
      schema: this.props.rootSchema,
      filters: this.props.filters,
      dependentSchema: this.props.dependentSchema,
      org: this.props.org,
      userId: common.getUserDoc().recordId
    });

    this.setState({
      moment: moment,
      records: RecordSummaryStore.getSchemaRecords({
        schema: this.props.rootSchema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      })
    });
  },
  componentDidMount: function() {
    console.log("Month:componentDidMount");
    defaultData.view = "Month";
    defaultData.moment = this.state.moment;
    var self = this;
    RecordSummaryStore.addChangeListener(self._onChange);
    SchemaStore.addChangeListener(self._onChange);
  },
  componentWillUnmount: function() {
    console.log("Month:componentWillUnmount");
    RecordSummaryStore.removeChangeListener(this._onChange);
    SchemaStore.removeChangeListener(this._onChange);
  } /*
	componentDidMount:function(){
		ActionCreator.getSchemaRecords({
				schema:this.props.rootSchema,
				filters:this.props.filters,
				dependentSchema:this.props.dependentSchema,
				org:this.props.org,
				userId:common.getUserDoc().recordId});
		RecordSummaryStore.addChangeListener(this._onChange);
		SchemaStore.addChangeListener(this._onChange);
	},*/,
  handleUpdateMonth: function(update) {
    console.log("Month:handleUpdateMonth");
    this.updateMonth(update);
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    console.log("Month:shouldComponentUpdate");
    var self = this;
    var startKey = self.props.startKey;
    if (!startKey) {
      var schema = SchemaStore.getSchema(this.props.schema);
      if (
        schema &&
        schema["@operations"] &&
        schema["@operations"].read &&
        schema["@operations"].read.getSummary &&
        schema["@operations"].read.getSummary.viewType &&
        schema["@operations"].read.getSummary.viewType == "calendar" &&
        schema["@operations"].read.getSummary.start
      ) {
        startKey = schema["@operations"].read.getSummary.start;
      }
    }
    var endKey = self.props.endKey;
    if (!endKey) {
      var schema = SchemaStore.getSchema(this.props.schema);
      if (
        schema &&
        schema["@operations"] &&
        schema["@operations"].read &&
        schema["@operations"].read.getSummary &&
        schema["@operations"].read.getSummary.viewType &&
        schema["@operations"].read.getSummary.viewType == "calendar" &&
        schema["@operations"].read.getSummary.end
      ) {
        startKey = schema["@operations"].read.getSummary.end;
      }
    }
    var records = nextState.moment.records;
    if (records && records.length > 0) {
      for (var count = 0; count < records.length; count++) {
        var record = records[count].value;
        var day = record[startKey].split(" ")[0].split("-");
        var time = record[startKey].split(" ")[1].split(":");

        var month = Date.prototype.months.indexOf(day[1]);
        var year = day[2] * 1;
        records[count].dt = new Date(year, month, day[0], time[0], time[1]);
      }
    } else {
      nextState.moment.records = [];
    }
    console.log(this.state.moment);
    console.log(nextState.moment);
    return JSON.stringify(this.state) != JSON.stringify(nextState);
    //return true;
  },
  render: function() {
    console.log("Month:render");
    //var calendar = new Calendar.Calendar(Calendar.SUNDAY);
    var moment = this.state.moment;
    var self = this;

    var startKey = self.props.startKey;
    var endKey = self.props.endKey;
    if (!startKey) {
      var schema = SchemaStore.getSchema(this.props.schema);
      if (
        schema &&
        schema["@operations"] &&
        schema["@operations"].read &&
        schema["@operations"].read.getSummary &&
        schema["@operations"].read.getSummary.viewType &&
        schema["@operations"].read.getSummary.viewType == "calendar" &&
        schema["@operations"].read.getSummary.start
      ) {
        startKey = schema["@operations"].read.getSummary.start;
      }
    }
    if (!endKey) {
      var schema = SchemaStore.getSchema(this.props.schema);
      if (
        schema &&
        schema["@operations"] &&
        schema["@operations"].read &&
        schema["@operations"].read.getSummary &&
        schema["@operations"].read.getSummary.viewType &&
        schema["@operations"].read.getSummary.viewType == "calendar" &&
        schema["@operations"].read.getSummary.end
      ) {
        endKey = schema["@operations"].read.getSummary.end;
      }
    }
    var records = this.state.moment.records;
    if (records && records.length > 0) {
      console.log("dt");
      for (var count = 0; count < records.length; count++) {
        var record = records[count].value;
        var day = record[startKey].split(" ")[0].split("-");
        var time = record[startKey].split(" ")[1].split(":");

        var month = Date.prototype.months.indexOf(day[1]);
        var year = day[2] * 1;
        records[count].dt = new Date(year, month, day[0], time[0], time[1]);
      }
    } else {
      this.state.moment.records = [];
      records = [];
    }
    console.log(this);
    var days = getDays(moment.year, moment.num);
    days = days.map(function(day) {
      return {
        year: day.getFullYear(),
        monthNum: day.getMonth() + 1,
        monthName: day.getFullMonthName(),
        num: day.getDate(),
        holiday: "",
        date: day
      };
    });
    //var records = this.state.moment.records;
    var tasks = days.map(function(day, index) {
      /*if(day.getFullYear() == records.dt.getFullYear())*/
      var d = {
        date: day.date,
        year: day.year,
        monthNum: day.monthNum,
        monthName: day.monthName,
        num: day.num,
        holiday: day.holiday,
        occasions: [],
        tasks: []
      };
      if (records.length > 0)
        for (var count = 0; count < records.length; count++) {
          if (
            day.date.getFullYear() == records[count].dt.getFullYear() &&
            day.date.getMonth() == records[count].dt.getMonth() &&
            day.date.getDate() == records[count].dt.getDate()
          ) {
            d.tasks.push(records[count]);
          }
        }
      return d;
    });
    return (
      <div>
        <div className="month">
          <div className="month-header row no-margin">
            <div className="col-lg-1 col-md-1 col-sm-2 col-xs-2 no-padding">
              {/*<span className="h2" onClick={this.updateMonth.bind(null, -1)}> &#9664; </span>*/}
              <i
                className="sleekIcon-leftarrow fa-2x link pull-left"
                onClick={this.updateMonth.bind(null, -1)}
                style={{ fontSize: "2.5em" }}
              />
            </div>
            <div className="col-lg-10 col-md-10 col-sm-8 col-xs-8">
              <span className="h5">
                {this.state.moment.name + " " + this.state.moment.year}
              </span>
            </div>
            <div className="col-lg-1 col-md-1 col-sm-2 col-xs-2 no-padding">
              {/*<span className="h2" onClick={this.updateMonth.bind(null, 1)}> &#9654; </span>*/}
              <i
                className="sleekIcon-rightarrow fa-2x link pull-right"
                onClick={this.updateMonth.bind(null, 1)}
                style={{ fontSize: "2.5em" }}
              />
            </div>
          </div>
          <div id="days-header">
            <ul>
              <li>SUN</li>
              <li>MON</li>
              <li>TUE</li>
              <li>WED</li>
              <li>THU</li>
              <li>FRI</li>
              <li>SAT</li>
            </ul>
          </div>
          <div className="days row no-margin">
            <Days
              moment={this.state.moment}
              days={tasks}
              selectedDay={this.state.selectedDay}
              schema={this.props.schema}
              org={this.props.org}
              rootSchema={this.props.rootSchema}
              dependentSchema={this.props.dependentSchema}
              selectDay={this.selectDay}
              startKey={startKey}
              endKey={endKey}
            />
          </div>
        </div>
        {/*<div>
							<button type='button' onClick={this.displayWeekView} className=" action-button">week</button>
						</div>*/}
      </div>
    );
  },
  displayWeekView: function() {
    console.log("Month:displayWeekView");
    var self = this;
    weekDays = [];
    var monthDays = getDays(self.state.moment.year, self.state.moment.num);
    for (var i = 0; i < 7; i++) {
      weekDays.push(monthDays[i]);
    }
    ReactDOM.unmountComponentAtNode(document.getElementById("defaultView"));
    console.log("Month:displayWeekView");
    RecordSummaryStore.removeChangeListener(this._onChange);
    SchemaStore.removeChangeListener(this._onChange);
    //document.getElementById('defaultView').innerHTML='';
    ReactDOM.render(
      <WeekView
        moment={self.state.moment}
        weekDays={weekDays}
        schema={self.props.schema}
        org={self.props.org}
        rootSchema={self.props.rootSchema}
        dependentSchema={self.props.dependentSchema}
        filters={this.props.filters}
        records={self.state.moment.records}
        startKey={self.props.startKey}
        endKey={self.props.endKey}
      />,
      document.getElementById("defaultView")
    );
  },
  selectDay: function(day) {
    //console.log("Month:selectDay");
    this.setState({ selectedDay: day });
  }
});

var Days = React.createClass({
  handleSelectedDay: function(index, data) {
    var day = {
      year: data.year,
      monthName: data.monthName,
      num: data.num,
      tasks: data.tasks,
      occasions: data.occasions
    };
    //this.props.selectDay(day);
    console.log("index: " + index);
    console.log(data);
    console.log(arguments);

    var rowIndex = parseInt(index / 7);
    var self = this;
    weekDays = [];
    var monthDays = self.props.days;
    for (var i = 0; i < 7; i++) {
      weekDays.push(monthDays[rowIndex * 7 + i].date);
    }
    //ReactDOM.unmountComponentAtNode(document.getElementById('defaultView'));
    document.getElementById("defaultView").innerHTML = "";
    ReactDOM.render(
      <WeekView
        moment={self.props.moment}
        weekDays={weekDays}
        schema={self.props.schema}
        org={self.props.org}
        rootSchema={self.props.rootSchema}
        dependentSchema={self.props.dependentSchema}
        filters={this.props.filters}
        startKey={self.props.startKey}
        endKey={self.props.endKey}
      />,
      document.getElementById("defaultView")
    );
  },
  render: function() {
    console.log("Days render");
    var self = this;
    var props = this.props;
    console.log(props);
    var days = this.props.days.map(function(day, index) {
      var classes = "day col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
      if (
        self.props.moment.todayYear == day.year &&
        self.props.moment.todayMonth == day.monthName &&
        self.props.moment.today == day.num
      ) {
        classes += " today";
      }
      if (
        self.props.selectedDay.year == day.year &&
        self.props.selectedDay.monthName == day.monthName &&
        self.props.selectedDay.num == day.num
      ) {
        classes += " selected";
      }
      if (
        self.props.moment.num - 1 == day.monthNum ||
        self.props.moment.year - 1 == day.year
      ) {
        classes += " prevMonth";
      }
      if (
        self.props.moment.num + 1 == day.monthNum ||
        self.props.moment.year + 1 == day.year
      ) {
        classes += " nextMonth";
      }
      if (day.date.getDay() == 6) {
        classes += " last";
      }

      if (day.tasks.length > 0) {
        classes += " task-div";
      }
      return (
        <div key={index} className={classes}>
          <span
            className="num"
            onClick={self.handleSelectedDay.bind(null, index, day)}
          >
            {day.num}
          </span>

          <div className="info row no-margin">
            <Tasks
              tasks={day.tasks}
              schema={self.props.schema}
              org={self.props.org}
              rootSchema={self.props.rootSchema}
              dependentSchema={self.props.dependentSchema}
            />
          </div>
        </div>
      );
    });
    return <div>{days}</div>;
  },
  componentWillUnmount: function() {
    console.log("Days Unmount");
  }
});

var Tasks = React.createClass({
  render: function() {
    console.log("Tasks render");
    var self = this;
    var classes = "task link";
    /*if(this.props.tasks.length > 0){
			var classes = "task link"
			var props = this.props;
			var self = this;
		}else{
			var tasks = [];
		}*/
    return (
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding">
        {this.props.tasks.map(function(task, index) {
          //console.log(task);
          if (index < 2) {
            return (
              <div
                key={global.guid()}
                className={classes}
                title={task.org + " " + task.id}
                onClick={self.viewRecord.bind(self, task.id)}
              >
                {task.schema +
                  " " +
                  task.dt.getHours() +
                  ":" +
                  task.dt.getMinutes()}
              </div>
            );
          } else if (index == 2) {
            return (
              <label
                key={global.guid()}
                className="read-more-trigger morelink link"
              >
                {self.props.tasks.length - 2 + " MORE"}
              </label>
            );
          } else {
            return <div key={global.guid()} />;
          }
        })}
      </div>
    );
  },
  viewRecord: function(recordId) {
    if (typeof this.props.fromRelation == "undefined") {
      schema = this.props.schema;
      org = this.props.org;
      var rootSchema = this.props.rootSchema;
      var self = this;
      var node = document.createElement("div");
      node.id = global.guid();
      var popUpId = global.guid();
      var contentDivId = global.guid();
      var sideDivId = global.guid();
      node.className =
        "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
      document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
      ReactDOM.render(
        <common.GenericPopUpComponent
          popUpId={popUpId}
          contentDivId={contentDivId}
          sideDivId={sideDivId}
          noSideDiv={true}
        />,
        node
      );
      ReactDOM.render(
        <genericView.GoIntoDetail
          rootSchema={rootSchema}
          dependentSchema={this.props.dependentSchema}
          recordId={recordId}
          org={this.props.org}
        />,
        document.getElementById(contentDivId)
      );
    }
  }
});

function getDays(year, month) {
  var isLeapYear = leapYear(year);
  var days = 0;
  var daysArr = [];
  if (month == 2) {
    isLeapYear ? (days += 29) : (days += 28);
  } else if (
    month == 1 ||
    month == 3 ||
    month == 5 ||
    month == 7 ||
    month == 8 ||
    month == 10 ||
    month == 12
  ) {
    days = 31;
  } else {
    days = 30;
  }
  var d = new Date(year, month - 1, 1);
  var xtraDays = d.getDay() - 1;

  for (var i = xtraDays; i >= 0; i--) {
    daysArr.push(new Date(d.setDate(0 - i)));
    d = new Date(year, month - 1, 1);
  }

  for (var i = 0; i < days; i++) {
    daysArr.push(new Date(year, month - 1, i + 1));
  }

  d = daysArr[daysArr.length - 1];
  xtraDays = d.getDay();

  for (i = 1, xtraDays; xtraDays < 6; i++, xtraDays++) {
    var nextDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    daysArr.push(nextDay);
  }
  return daysArr;
}

function leapYear(year) {
  return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}

exports.Cal = Cal;

var WeekView = React.createClass({
  getInitialState: function() {
    console.log("WeekView initial");
    var self = this;
    var monthDays = getDays(self.props.moment.year, self.props.moment.num + 1);
    console.log(self.props.moment);
    return {
      weekDays: self.props.weekDays,
      moment: self.props.moment,
      records: self.props.moment.records,
      monthDays: monthDays
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    console.log("WeekView should update");
    return JSON.stringify(this.state) != JSON.stringify(nextState);
  },
  _onChange: function() {
    console.log("WeekView onChange");
    if (!this.props.filters) {
      this.props.filters = {};
    }
    this.props.filters.dateModified = [
      this.state.moment.year + "" + this.state.moment.num
    ];
    this.setState({
      records: RecordSummaryStore.getSchemaRecords({
        schema: this.props.rootSchema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      })
    });
  },
  componentDidMount: function() {
    defaultData.view = "Week";
    defaultData.weekDays = this.state.weekDays;
    var self = this;
    RecordSummaryStore.addChangeListener(self._onChange);
    SchemaStore.addChangeListener(self._onChange);
  },
  componentWillUnmount: function() {
    var self = this;
    RecordSummaryStore.removeChangeListener(self._onChange);
  },
  render: function() {
    console.log("WeekView render");
    var records = [];
    var weekDays = this.state.weekDays;
    console.log(this.props);
    var fMonth = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    var startKey = this.props.startKey,
      endKey = this.props.endKey;
    if (!startKey) {
      var schema = SchemaStore.getSchema(this.props.schema);
      if (
        schema &&
        schema["@operations"] &&
        schema["@operations"].read &&
        schema["@operations"].read.getSummary &&
        schema["@operations"].read.getSummary.viewType &&
        schema["@operations"].read.getSummary.viewType == "calendar" &&
        schema["@operations"].read.getSummary.start
      ) {
        startKey = schema["@operations"].read.getSummary.start;
      }
    }
    if (!startKey) {
      var schema = SchemaStore.getSchema(this.props.schema);
      if (
        schema &&
        schema["@operations"] &&
        schema["@operations"].read &&
        schema["@operations"].read.getSummary &&
        schema["@operations"].read.getSummary.viewType &&
        schema["@operations"].read.getSummary.viewType == "calendar" &&
        schema["@operations"].read.getSummary.end
      ) {
        endKey = schema["@operations"].read.getSummary.end;
      }
    }
    this.state.moment.records.forEach(function(record) {
      console.log(record);
      var dt = record.value[startKey].split(" ");
      var date = dt[0].indexOf("-") == -1 ? dt[0].split("/") : dt[0].split("-");
      //console.log(date);
      var time = dt[1];
      //console.log(time);
      time = time ? time.split(":") : [0, 0];
      date = new Date(
        date[2],
        fMonth.indexOf(date[1]),
        date[0],
        time[0],
        time[1]
      );
      record["dt"] = date;
      records.push(record);
    });
    console.log("At least one pushed");
    console.log(records);
    var tasks = weekDays.map(function(day, index) {
      var d = {
        date: day,
        year: day.getFullYear(),
        monthNum: day.getMonth(),
        monthName: day.getFullMonthName(),
        num: day.getDate(),
        occasions: [],
        tasks: []
      };
      if (records.length > 0)
        for (var count = 0; count < records.length; count++) {
          if (
            day.getFullYear() == records[count].dt.getFullYear() &&
            day.getMonth() == records[count].dt.getMonth() &&
            day.getDate() == records[count].dt.getDate()
          ) {
            d.date = records[count].dt;
            d.tasks.push(records[count]);
          }
        }
      return d;
    });
    var hours = [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23
    ];
    var days = [0, 1, 2, 3, 4, 5, 6];
    var self = this;
    var kk = 0;
    //console.log(tasks);
    return (
      <div>
        <div className="month-header row no-margin">
          <div className="col-lg-1 col-md-1 col-sm-2 col-xs-2 no-padding">
            {/*<span className="h2" onClick={this.updateMonth.bind(null, -1)}> &#9664; </span>*/}
            <i
              className="sleekIcon-leftarrow fa-2x link pull-left"
              onClick={this.updateWeek.bind(null, -1)}
              style={{ fontSize: "2.5em" }}
            />
          </div>
          <div className="col-lg-10 col-md-10 col-sm-8 col-xs-8">
            <span className="h5 link" onClick={this.displayMonthView}>
              {weekDays[0].getMonthName() +
                " " +
                weekDays[0].getDate() +
                " - " +
                weekDays[6].getMonthName() +
                " " +
                weekDays[6].getDate()}
            </span>
          </div>
          <div className="col-lg-1 col-md-1 col-sm-2 col-xs-2 no-padding">
            {/*<span className="h2" onClick={this.updateMonth.bind(null, 1)}> &#9654; </span>*/}
            <i
              className="sleekIcon-rightarrow fa-2x link pull-right"
              onClick={this.updateWeek.bind(null, 1)}
              style={{ fontSize: "2.5em" }}
            />
          </div>
        </div>

        <div id="week-header">
          <ul>
            <li> &nbsp;</li>
            <li onClick={self.displayDayView.bind(null, weekDays[0])}>
              {weekDays[0].getDate() + "/" + (weekDays[0].getMonth() + 1)}
            </li>
            <li onClick={self.displayDayView.bind(null, weekDays[1])}>
              {weekDays[1].getDate() + "/" + (weekDays[1].getMonth() + 1)}
            </li>
            <li onClick={self.displayDayView.bind(null, weekDays[2])}>
              {weekDays[2].getDate() + "/" + (weekDays[2].getMonth() + 1)}
            </li>
            <li onClick={self.displayDayView.bind(null, weekDays[3])}>
              {weekDays[3].getDate() + "/" + (weekDays[3].getMonth() + 1)}
            </li>
            <li onClick={self.displayDayView.bind(null, weekDays[4])}>
              {weekDays[4].getDate() + "/" + (weekDays[4].getMonth() + 1)}
            </li>
            <li onClick={self.displayDayView.bind(null, weekDays[5])}>
              {weekDays[5].getDate() + "/" + (weekDays[5].getMonth() + 1)}
            </li>
            <li onClick={self.displayDayView.bind(null, weekDays[6])}>
              {weekDays[6].getDate() + "/" + (weekDays[6].getMonth() + 1)}
            </li>
          </ul>
        </div>
        <div className="totalDays">
          {hours.map(function(hour) {
            var ds = [];
            return (
              <div key={global.guid()}>
                <div className="beginDay">
                  <span className="noTask">
                    {hour < 12
                      ? (hour == 0 ? 12 : hour) + " am"
                      : (hour - 12 == 0 ? 12 : hour - 12) + " pm"}
                  </span>
                </div>
                {days.map(function(day) {
                  var dt = tasks[day];
                  var d = new Date(
                    dt.year,
                    dt.monthNum,
                    dt.date.getDate(),
                    hour
                  );
                  /*if(dt.date.getMonth() == d.getMonth()){
														console.log(dt.date);
														console.log(d);
													}*/
                  if (
                    dt.date.getMonth() == d.getMonth() &&
                    dt.date.getDate() == d.getDate() &&
                    dt.tasks.length > 0
                  ) {
                    var hourTasks = [];
                    dt.tasks.map(function(task) {
                      if (d.getHours() == task.dt.getHours()) {
                        hourTasks.push(task);
                      }
                    });
                    return (
                      <div
                        key={global.guid()}
                        className="weekDay"
                        onClick={self.displayDayView.bind(null, d, dt.tasks)}
                      >
                        <Tasks
                          tasks={hourTasks}
                          schema={self.props.schema}
                          org={self.props.org}
                          rootSchema={self.props.rootSchema}
                          dependentSchema={self.props.dependentSchema}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={global.guid()}
                        className="weekDay"
                        onClick={self.displayDayView.bind(null, d, dt.tasks)}
                      >
                        <span className="noTask" />
                      </div>
                    );
                  }
                  //ds.splice(0,0,<div className="beginDay">{(hour<12?(hour==0?12:hour)+" am":(hour-12==0?12:hour-12)+" pm")}</div>)
                  //return ds
                })}
              </div>
            );
          })}
        </div>
        {/*
					<div>
						<button type='button' onClick={this.displayMonthView} className=" action-button">month</button>
					</div>
					*/}
      </div>
    );
  },
  updateWeek: function(update) {
    var lastDay,
      dt,
      mnth,
      yr,
      weekDays = [];
    var self = this;
    if (update > 0) {
      lastDay = this.state.weekDays[6];
      dt = lastDay.getDate();
      mnth = lastDay.getMonth();
      yr = lastDay.getFullYear();
      for (var i = 1; i < 8; i++) {
        weekDays.push(new Date(yr, mnth, dt + i));
      }
    } else {
      lastDay = this.state.weekDays[0];
      dt = lastDay.getDate();
      mnth = lastDay.getMonth();
      yr = lastDay.getFullYear();

      for (var i = 7; i > 0; i--) {
        weekDays.push(new Date(yr, mnth, dt - i));
      }
    }
    //console.log(weekDays);
    if (
      weekDays[0].getMonth() != this.state.moment.num &&
      weekDays[6].getMonth() != this.state.moment.num
    ) {
      //console.log("Month changed: "+this.state.moment.num);
      this.state.moment.moment = new Date(
        lastDay.getFullYear(),
        lastDay.getMonth()
      );
      this.state.moment.name = lastDay.getFullMonthName();
      this.state.moment.num = lastDay.getMonth() + 1;
      this.state.moment.year = lastDay.getFullYear();
      this.state.moment.records = RecordSummaryStore.getSchemaRecords({
        schema: this.props.rootSchema,
        filter: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      });
      ActionCreator.getSchemaRecords({
        schema: this.props.rootSchema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      });
    }
    this.setState({ weekDays: weekDays });
  },
  displayMonthView: function() {
    var self = this;
    var selectedDay = {
      year: null,
      month: null,
      num: null,
      tasks: [],
      occasions: []
    };
    //ReactDOM.unmountComponentAtNode(document.getElementById('defaultView'));
    document.getElementById("defaultView").innerHTML = "";
    ReactDOM.render(
      <Month
        moment={self.state.moment}
        selectedDay={selectedDay}
        records={self.props.records}
        schema={self.props.schema}
        org={self.props.org}
        rootSchema={self.props.rootSchema}
        dependentSchema={this.props.dependentSchema}
        filters={self.props.filters}
      />,
      document.getElementById("defaultView")
    );
  },
  displayDayView: function(day, tasks) {
    var self = this;
    var selectedDay = {
      year: day.getFullYear(),
      month: day.getMonth(),
      num: day.getDate(),
      tasks: tasks,
      occasions: []
    };
    console.log(day);
    //ReactDOM.unmountComponentAtNode(document.getElementById('defaultView'));
    document.getElementById("defaultView").innerHTML = "";
    ReactDOM.render(
      <DayView
        moment={self.state.moment}
        day={day}
        records={self.props.records}
        schema={self.props.schema}
        org={self.props.org}
        rootSchema={self.props.rootSchema}
        dependentSchema={this.props.dependentSchema}
        filters={self.props.filters}
      />,
      document.getElementById("defaultView")
    );
  }
});

/*
 * Day View
 *
 * */
var DayView = React.createClass({
  getInitialState: function() {
    var self = this;
    var monthDays = getDays(self.props.moment.year, self.props.moment.num + 1);
    return {
      selectedDay: self.props.day,
      weekDays: self.props.weekDays,
      moment: self.props.moment,
      records: self.props.records,
      monthDays: monthDays
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return this.state.selectedDay != nextState.selectedDay;
  },
  _onChange: function() {
    if (!this.props.filters) {
      this.props.filters = {};
    }
    this.props.filters.dateModified = [
      this.state.moment.year + "" + this.state.moment.num
    ];
    this.setState({
      records: RecordSummaryStore.getSchemaRecords({
        schema: this.props.rootSchema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      })
    });
  },
  componentDidMount: function() {
    defaultData.view = "Day";
    defaultData.day = this.state.selectedDay;
    var self = this;
    RecordSummaryStore.addChangeListener(self._onChange);
    SchemaStore.addChangeListener(self._onChange);
  },
  componentWillUnmount: function() {
    var self = this;
    RecordSummaryStore.removeChangeListener(self._onChange);
  },
  render: function() {
    var records = [];
    var selectedDay = this.state.selectedDay;
    console.log(this.state);
    var fMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    this.state.moment.records.forEach(function(record) {
      if (!record["dt"] && record.value.dateTime[0]) {
        var dt = record.value.dateTime[0].split(" ");
        var date =
          dt[0].indexOf("-") == -1 ? dt[0].split("/") : dt[0].split("-");
        console.log(date);
        var time = dt[1];
        console.log(time);
        time = time ? time.split(":") : [0, 0];
        date = new Date(
          date[2],
          fMonths.indexOf(date[1]),
          date[0],
          time[0],
          time[1]
        );
        record["dt"] = date;
      }
      records.push(record);
    });
    var tasks = [selectedDay].map(function(day, index) {
      var d = {
        date: day,
        year: day.getFullYear(),
        monthNum: day.getMonth() - 1,
        monthName: day.getFullMonthName(),
        num: day.getDate(),
        occasions: [],
        tasks: []
      };
      if (records.length > 0)
        for (var count = 0; count < records.length; count++) {
          if (
            day.getFullYear() == records[count].dt.getFullYear() &&
            day.getMonth() == records[count].dt.getMonth() &&
            day.getDate() == records[count].dt.getDate()
          ) {
            d.date = records[count].dt;
            d.tasks.push(records[count]);
          }
        }
      return d;
    });
    //console.log(records);
    //console.log(tasks);
    var hours = [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23
    ];
    var days = [0];
    var self = this;
    var kk = 0;
    var dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];
    return (
      <div>
        <div className="month-header row no-margin">
          <div className="col-lg-1 col-md-1 col-sm-2 col-xs-2 no-padding">
            <i
              className="sleekIcon-leftarrow fa-2x link pull-left"
              onClick={this.updateDay.bind(null, -1)}
              style={{ fontSize: "2.5em" }}
            />
          </div>
          <div className="col-lg-10 col-md-10 col-sm-8 col-xs-8">
            <span className="h5 link" onClick={this.displayMonthView}>
              {dayNames[selectedDay.getDay()] +
                ", " +
                selectedDay.getFullMonthName() +
                " " +
                selectedDay.getDate() +
                ", " +
                selectedDay.getFullYear()}
            </span>
          </div>
          <div className="col-lg-1 col-md-1 col-sm-2 col-xs-2 no-padding">
            <i
              className="sleekIcon-rightarrow fa-2x link pull-right"
              onClick={this.updateDay.bind(null, 1)}
              style={{ fontSize: "2.5em" }}
            />
          </div>
        </div>

        {/*
					<div id="day-header">
						<ul>
							<li> &nbsp;</li>
							<li>{dayNames[selectedDay.getDay()]}</li>
						</ul>
					</div>
					*/}
        <div className="Day">
          {hours.map(function(hour) {
            var ds = [];
            return (
              <div key={global.guid()}>
                <div className="beginDay">
                  <span className="noTask">
                    {hour < 12
                      ? (hour == 0 ? 12 : hour) + " am"
                      : (hour - 12 == 0 ? 12 : hour - 12) + " pm"}
                  </span>
                </div>
                {days.map(function(day) {
                  var dt = tasks[day];
                  var d = new Date(
                    dt.year,
                    dt.monthNum,
                    dt.date.getDate(),
                    hour
                  );
                  if (dt.tasks.length > 0) {
                    var hourTasks = [];
                    dt.tasks.map(function(task) {
                      if (d.getHours() == task.dt.getHours()) {
                        hourTasks.push(task);
                      }
                    });

                    return (
                      <div key={global.guid()} className="weekDay">
                        <DayTasks
                          tasks={hourTasks}
                          schema={self.props.schema}
                          org={self.props.org}
                          rootSchema={self.props.rootSchema}
                          dependentSchema={self.props.dependentSchema}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div key={global.guid()} className="weekDay">
                        <span className="noTask" />
                      </div>
                    );
                  }
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
  updateDay: function(update) {
    var lastDay,
      dt,
      mnth,
      yr,
      weekDays = [];
    var self = this;
    var selectedDay;
    if (update > 0) {
      lastDay = this.state.selectedDay;
      selectedDay = new Date(lastDay.setDate(lastDay.getDate() + 1));
    } else {
      lastDay = this.state.selectedDay;
      selectedDay = new Date(lastDay.setDate(lastDay.getDate() - 1));
    }
    console.log(lastDay);
    var records;
    if (selectedDay.getMonth() != this.state.moment.num - 1) {
      //console.log("Month changed: "+this.state.moment.num);
      this.state.moment.moment = new Date(
        selectedDay.getFullYear(),
        selectedDay.getMonth()
      );
      this.state.moment.name = selectedDay.getFullMonthName();
      this.state.moment.num = selectedDay.getMonth() + 1;
      this.state.moment.year = selectedDay.getFullYear();
      records = RecordSummaryStore.getSchemaRecords({
        schema: this.props.rootSchema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      });
      ActionCreator.getSchemaRecords({
        schema: this.props.rootSchema,
        filters: this.props.filters,
        dependentSchema: this.props.dependentSchema,
        org: this.props.org,
        userId: common.getUserDoc().recordId
      });
    }
    console.log(this.state);
    this.setState({ selectedDay: selectedDay, records: records });
  },
  displayMonthView: function() {
    var self = this;
    var selectedDay = {
      year: self.state.selectedDay.getFullYear(),
      month: self.state.selectedDay.getMonth(),
      num: self.state.selectedDay.getDate(),
      tasks: [],
      occasions: []
    };
    //ReactDOM.unmountComponentAtNode(document.getElementById('defaultView'));

    document.getElementById("defaultView").innerHTML = "";
    ReactDOM.render(
      <Month
        moment={self.state.moment}
        selectedDay={selectedDay}
        records={self.props.records}
        schema={self.props.schema}
        org={self.props.org}
        rootSchema={self.props.rootSchema}
        dependentSchema={this.props.dependentSchema}
        filters={self.props.filters}
      />,
      document.getElementById("defaultView")
    );
  }
});

var DayTasks = React.createClass({
  render: function() {
    var self = this;
    /*if(this.props.tasks.length > 0){
			var classes = "task link"
			var props = this.props;
			var self = this;
		}else{
			var tasks = [];
		}*/

    var width = 0;
    var hourTasks = this.props.tasks;
    //console.log(hourTasks);
    if (hourTasks.length > 9) {
      width = 100 / 9;
    } else {
      width = 100 / hourTasks.length;
    }
    var days = [];
    if (self.props.tasks.length > 0) {
      days = self.props.tasks.map(function(task, index) {
        var style = {};
        style.position = "absolute";
        var date = task.dt;

        if (date.getMinutes() > 15) {
          style.top = date.getMinutes() + "px";
        }
        if (date.getMinutes() > 30) {
          style.top = date.getMinutes() + "px";
        }
        if (date.getMinutes() > 45) {
          style.top = "45px";
        }
        if (date.getMinutes() < 15) {
          style.top = date.getMinutes() + "px";
        }
        style.left = index * width + "%";
        style.width = width + "%";
        return (
          <div
            key={global.guid()}
            className="col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding"
            style={style}
          >
            <div
              className="task link"
              title={
                task.org + "," + task.dt.getHours() + ":" + task.dt.getMinutes()
              }
              onClick={self.viewRecord.bind(self, task.id)}
            >
              {task.dt.getHours() + ":" + task.dt.getMinutes()}
            </div>
          </div>
        );
      });
    } else {
      days = (
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12  no-padding" />
      );
    }
    return <span>{days}</span>;
  },
  viewRecord: function(recordId) {
    if (typeof this.props.fromRelation == "undefined") {
      schema = this.props.schema;
      org = this.props.org;
      var rootSchema = this.props.rootSchema;
      var self = this;
      var node = document.createElement("div");
      node.id = global.guid();
      var popUpId = global.guid();
      var contentDivId = global.guid();
      var sideDivId = global.guid();
      node.className =
        "lookUpDialogBox popUpLoginDiv col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding";
      document.getElementById("lookUpDialogBox").parentNode.appendChild(node);
      ReactDOM.render(
        <common.GenericPopUpComponent
          popUpId={popUpId}
          contentDivId={contentDivId}
          sideDivId={sideDivId}
          noSideDiv={true}
        />,
        node
      );
      ReactDOM.render(
        <genericView.GoIntoDetail
          rootSchema={rootSchema}
          dependentSchema={this.props.dependentSchema}
          recordId={recordId}
          org={this.props.org}
        />,
        document.getElementById(contentDivId)
      );
    }
  }
});
