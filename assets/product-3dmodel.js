if (!customElements.get('product-model')) {
  customElements.define(
    'product-model',
    class ProductModel extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        const modelViewer = this.querySelector('model-viewer');
        if (!modelViewer) return;        

        Shopify.loadFeatures([
          {
            name: 'model-viewer-ui',
            version: '1.0',
            onLoad: (errors) => {
              if (errors) {
                console.error('ModelViewerUI failed to load:', errors);
                return;
              }
              this.modelViewerUI = new Shopify.ModelViewerUI(modelViewer);
            },
          },
        ]);
      }
    }
  );
}

window.ProductModel = {
  loadShopifyXR() {
    Shopify.loadFeatures([
      {
        name: 'shopify-xr',
        version: '1.0',
        onLoad: this.setupShopifyXR.bind(this),
      },
    ]);
  },

  setupShopifyXR(errors) {
    if (errors) return;

    if (!window.ShopifyXR) {
      document.addEventListener('shopify_xr_initialized', () => this.setupShopifyXR());
      return;
    }

    document.querySelectorAll('[id^="ProductJSON-"]').forEach((modelJSON) => {
      window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
      modelJSON.remove();
    });
    window.ShopifyXR.setupXRElements();
  },
};

window.addEventListener('DOMContentLoaded', () => {
  if (window.ProductModel) window.ProductModel.loadShopifyXR();
});
