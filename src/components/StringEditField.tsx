import React, { Component } from "react";

interface StringEditFieldProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
}

interface StringEditFieldState {
  value: string;
}

export class StringEditField extends Component<StringEditFieldProps, StringEditFieldState> {
  constructor(props: StringEditFieldProps) {
    super(props);
    this.state = {
      value: props.value,
    };
  }

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    this.setState({ value: newValue });

    // Call arbitrary onChange callback
    this.props.onChange(newValue);
  };

  render() {
    const { label } = this.props;
    const { value } = this.state;

    return (
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <label style={{ marginRight: 8, minWidth: 120 }}>{label}</label>
        <input
          type="text"
          value={value}
          onChange={this.handleChange}
          style={{ flexGrow: 1, padding: 6 }}
        />
      </div>
    );
  }
}
