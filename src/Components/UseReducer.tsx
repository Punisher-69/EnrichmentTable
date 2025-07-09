import { Button } from "@heroui/react";
import { useReducer } from "react";

export default function UseRed() {
  type State = {
    name: string;
    age: number;
    admin: boolean;
  };

  type Action =
    | { type: "setName"; payload: string }
    | { type: "setAge"; payload: number }
    | { type: "setAdmin"; payload: boolean };

  const initialStates: State = {
    name: "Usman",
    age: 20,
    admin: true,
  };

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case "setName":
        return { ...state, name: action.payload };
      case "setAge":
        return { ...state, age: action.payload };
      case "setAdmin":
        return { ...state, admin: action.payload };
      default:
        return state;
        break;
    }
  }

  const [state, dispatcher] = useReducer(reducer, initialStates);

  const changeValues = () => {
    dispatcher({ type: "setName", payload: "Jutt" });
    dispatcher({ type: "setAge", payload: 18 });
    dispatcher({ type: "setAdmin", payload: false });
  };

  return (
    <div>
      <p> Name:{state.name} </p>
      <p> Age:{state.age} </p>
      <p> Admin:{state.admin.toString()} </p>

      <Button onPress={() => changeValues()}>Change the values</Button>
    </div>
  );
}
