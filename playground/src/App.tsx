import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Schema from '../../src'

const validate = (rule, source) => {
  return new Schema(rule).validate(source);
}

const App = () => {
  const rule = {};
  const source = {};
  const [errors, setErrors] = useState([])
  const runValidate = async () => {
    try {
      await validate(rule, source);
      setErrors([])
    } catch (e) {
      setErrors(e.errors)
    }
    
  }
  
  return (
    <>
    <div>{JSON.stringify(errors)}</div>
    <Button onClick={runValidate}>App</Button>
    </>
  );
};

export default App;
