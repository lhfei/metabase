/* eslint-disable react/prop-types */
import cx from "classnames";
import PropTypes from "prop-types";
import { Component } from "react";

import CS from "metabase/css/core/index.css";

/*
   Creates a bordered container for an <Icon /> component
   based on the <Icon /> component's size.

   usage:
   <IconBorder {...props} >
   <Icon name={chevrondown} size={12} />
   </IconBorder>
 */

export default class IconBorder extends Component {
  static propTypes = {
    borderWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    borderStyle: PropTypes.string,
    borderColor: PropTypes.string,
    borderRadius: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.any.isRequired,
  };

  static defaultProps = {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "currentcolor",
    borderRadius: "99px",
    style: {},
  };

  render() {
    const {
      borderWidth,
      borderStyle,
      borderColor,
      borderRadius,
      className,
      style,
      children,
    } = this.props;
    const size = parseInt(children.props.size || children.props.width, 10) * 2;
    const styles = {
      width: size,
      height: size,
      borderWidth: borderWidth,
      borderStyle: borderStyle,
      borderColor: borderColor,
      borderRadius: borderRadius,
      ...style,
    };

    return (
      <div className={cx(CS.flex, CS.layoutCentered, className)} style={styles}>
        {children}
      </div>
    );
  }
}
