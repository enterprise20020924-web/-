import type { ImageAssetResolver } from './persistent-image-cache';

/** Handles only registered image URLs; other TT/ST images and non-image elements are untouched. */
export function bindCachedImages(target: Window, resolver: ImageAssetResolver): () => void {
  const realm = target as Window & typeof globalThis;
  const imagePrototype = realm.HTMLImageElement.prototype;
  const sourceDescriptor = Object.getOwnPropertyDescriptor(imagePrototype, 'src')!;
  const setAttributeDescriptor = Object.getOwnPropertyDescriptor(imagePrototype, 'setAttribute');
  const removeAttributeDescriptor = Object.getOwnPropertyDescriptor(imagePrototype, 'removeAttribute');
  const originalSetAttribute = imagePrototype.setAttribute;
  const originalRemoveAttribute = imagePrototype.removeAttribute;
  const requests = new WeakMap<HTMLImageElement, { source: string; token: object }>();
  let disposed = false;

  const setSource = (image: HTMLImageElement, source: string) => {
    requests.delete(image);
    if (disposed || !resolver.handles(source)) {
      sourceDescriptor.set!.call(image, source);
      return;
    }
    const request = { source, token: {} };
    requests.set(image, request);
    const existing = resolver.peek(source);
    if (existing) {
      sourceDescriptor.set!.call(image, existing);
      return;
    }
    // Do not issue the original remote request while a saved native/browser image is being read.
    originalRemoveAttribute.call(image, 'src');
    void resolver
      .resolve(source)
      .then(url => {
        if (!disposed && requests.get(image)?.token === request.token) sourceDescriptor.set!.call(image, url);
      })
      .catch(() => {
        // A failed cache read must not prevent the existing image fallback UI from working.
        if (!disposed && requests.get(image)?.token === request.token) sourceDescriptor.set!.call(image, source);
      });
  };
  const descriptor: PropertyDescriptor = {
    ...sourceDescriptor,
    get(this: HTMLImageElement) {
      return requests.get(this)?.source ?? sourceDescriptor.get!.call(this);
    },
    set(this: HTMLImageElement, value: string) {
      setSource(this, String(value));
    },
  };
  const setAttribute: typeof originalSetAttribute = function (this: Element, name, value) {
    if (this instanceof realm.HTMLImageElement && name.toLowerCase() === 'src') setSource(this, String(value));
    else originalSetAttribute.call(this, name, value);
  };
  const removeAttribute: typeof originalRemoveAttribute = function (this: Element, name) {
    if (this instanceof realm.HTMLImageElement && name.toLowerCase() === 'src') requests.delete(this);
    originalRemoveAttribute.call(this, name);
  };
  Object.defineProperty(imagePrototype, 'src', descriptor);
  imagePrototype.setAttribute = setAttribute;
  imagePrototype.removeAttribute = removeAttribute;
  return () => {
    disposed = true;
    if (Object.getOwnPropertyDescriptor(imagePrototype, 'src')?.set === descriptor.set) {
      Object.defineProperty(imagePrototype, 'src', sourceDescriptor);
    }
    if (imagePrototype.setAttribute === setAttribute) {
      if (setAttributeDescriptor) Object.defineProperty(imagePrototype, 'setAttribute', setAttributeDescriptor);
      else Reflect.deleteProperty(imagePrototype, 'setAttribute');
    }
    if (imagePrototype.removeAttribute === removeAttribute) {
      if (removeAttributeDescriptor)
        Object.defineProperty(imagePrototype, 'removeAttribute', removeAttributeDescriptor);
      else Reflect.deleteProperty(imagePrototype, 'removeAttribute');
    }
  };
}
