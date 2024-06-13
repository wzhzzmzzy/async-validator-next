import React, { useState } from "react";
import Schema from "../../src";
import type { Rules, Values } from "../../src";
import { Button } from "@/components/ui/button";

function validate(rule: Rules, source: Values) {
  return new Schema(rule).validate(source);
}

function App() {
  const rule = { o: { validator: (r, v) => v > 1 } };
  const source = {};
  const [errors, setErrors] = useState([]);
  const runValidate = async () => {
    try {
      await validate(rule, source);
      setErrors([]);
    } catch (e) {
      setErrors(e.errors);
    }
  };

  return (
    <>
      <div>{JSON.stringify(errors)}</div>
      <Button onClick={runValidate}>Validate</Button>
    </>
  );
}

export default App;
