/**
 * @author - Vikram
 */
var React = require("react");
//var ReactDOM = require('react-dom');
var JunctionCountStore = require("../../../stores/JunctionCountStore");
var JunctionStore = require("../../../stores/JunctionStore");
var ActionCreator = require("../../../actions/ActionCreator.js");
//var global=require('../../../utils/global.js');
/**
 * recordId
 * relationName
 */
var JunctionCount = React.createClass({
  getInitialState: function() {
    return {
      count: JunctionCountStore.getRelatedCount(
        this.props.recordId,
        this.props.relationName
      )
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return JSON.stringify(this.state) != JSON.stringify(nextState);
  },
  _onChange: function() {
    this.setState({
      count: JunctionCountStore.getRelatedCount(
        this.props.recordId,
        this.props.relationName
      )
    });
  },
  _refreshCounts: function() {
    var self = this;
    if (
      this.props.relationName != "likedBy" &&
      this.props.relationName != "followedBy"
    ) {
      setTimeout(function() {
        ActionCreator.getRelatedCount({
          recordId: self.props.recordId,
          rootSchema: self.props.rootSchema,
          relationName: self.props.relationName,
          relationRefSchema: self.props.relationRefSchema
        });
      }, 5000);
    }
  },
  componentWillUnmount: function() {
    JunctionCountStore.removeChangeListener(this._onChange);
    JunctionStore.removeChangeListener(
      this._refreshCounts,
      this.state.recordId + "-" + this.props.relationName
    );
  },
  componentDidMount: function() {
    if (
      this.props.relationName != "likedBy" &&
      this.props.relationName != "followedBy"
    ) {
      ActionCreator.getRelatedCount({
        recordId: this.props.recordId,
        relationName: this.props.relationName
      });
    }
    JunctionCountStore.addChangeListener(this._onChange);
    JunctionStore.addChangeListener(
      this._refreshCounts,
      this.state.recordId + "-" + this.props.relationName
    );
  },
  componentDidUpdate: function() {},
  render: function() {
    if (this.props.withBrackets) {
      if (this.state.count == 0 || this.state.count == undefined) {
        return <span />;
      } else {
        return <span>({this.state.count})</span>;
      }
    } else {
      return <span>{this.state.count == 0 ? "" : this.state.count}</span>;
    }
  }
});
exports.JunctionCount = JunctionCount;
