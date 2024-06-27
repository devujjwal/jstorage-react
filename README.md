# jStorageReact

jStorageReact is a TypeScript library that provides storage functionality for React applications, converted from the jStorage plugin originally built for jQuery applications.

## Installation

You can install jStorageReact via npm:
`npm install jstorage-react`

## Usage

Here's how you can use jStorageReact in your React application:

```javascript
import React, { useState, useEffect } from "react";
import jStorageReact from "jstorage-react";

const App: React.FC = () => {
  const [data, setData] = useState < string > "";

  useEffect(() => {
    const storedData = jStorageReact.get("myKey");
    if (storedData) {
      setData(storedData);
    }
  }, []);

  const handleSave = () => {
    jStorageReact.set("myKey", data);
  };

  const handleDelete = () => {
    jStorageReact.deleteKey("myKey");
    setData("");
  };

  return (
    <div>
      <input
        type="text"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default App;
```

# API

### set(key: string, value: any, options?: { TTL?: number }): void

Sets a value in storage with an optional TTL (Time-To-Live).

### get(key: string): any

Retrieves a value from storage.

### deleteKey(key: string): boolean

Deletes a key from storage.

### setTTL(key: string, ttl: number): void

Sets a TTL for a specific key.

### getTTL(key: string): number

Gets the TTL for a specific key.

### flush(): void

Clears all storage.
