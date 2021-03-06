export function domLoadImage(callback: any) {
  let input = document.querySelector("#fileInput");
  async function handleChange(this: any) {
    for (let item of this.files) {
      if (item.type.indexOf("image") < 0) {
        continue;
      }
      let src = URL.createObjectURL(item);
      callback(src);
      this.removeEventListener("change", handleChange);
    }
  }
  input!.addEventListener("change", handleChange);

  input!.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  );
  return input;
}
