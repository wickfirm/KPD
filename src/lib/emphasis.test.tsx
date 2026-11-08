import { describe, expect, it } from "vitest";
import { emphasisNodes } from "./emphasis";

describe("emphasisNodes", () => {
  it("passes plain text through as a single node", () => {
    expect(emphasisNodes("The Art of Knowing")).toEqual(["The Art of Knowing"]);
  });

  it("renders **bold** as strong and [[soft]] as a muted span", () => {
    const nodes = emphasisNodes("Every decision **begins with understanding**. [[As the UAE arm,]] we build.");
    expect(nodes).toHaveLength(4);
    const strong = nodes[1] as { type: string; props: { children: string } };
    expect(strong.type).toBe("strong");
    expect(strong.props.children).toBe("begins with understanding");
    const soft = nodes[2] as { type: string; props: { className: string; children: string } };
    expect(soft.type).toBe("span");
    expect(soft.props.className).toBe("soft");
    expect(soft.props.children).toBe("As the UAE arm,");
  });

  it("turns line breaks into <br>", () => {
    const nodes = emphasisNodes("Turning Challenge\nInto Value");
    expect(nodes).toHaveLength(3);
    expect((nodes[1] as { type: string }).type).toBe("br");
  });

  it("leaves unclosed markers as literal text", () => {
    expect(emphasisNodes("a ** b [[ c")).toEqual(["a ** b [[ c"]);
    expect(emphasisNodes("****")).toEqual(["****"]);
  });

  it("keeps multiple markers in order", () => {
    const nodes = emphasisNodes("**a** plain [[b]] more **c**");
    expect(nodes).toHaveLength(5);
    expect((nodes[0] as { type: string }).type).toBe("strong");
    expect(nodes[1]).toBe(" plain ");
    expect((nodes[2] as { type: string }).type).toBe("span");
    expect(nodes[3]).toBe(" more ");
    expect((nodes[4] as { type: string }).type).toBe("strong");
  });
});
