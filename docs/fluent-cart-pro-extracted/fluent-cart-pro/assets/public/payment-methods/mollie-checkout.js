class p{constructor(e,t,o){var a;this.form=e,this.data=t,this.paymentArgs=t.payment_args,this.paymentLoader=o,this.$t=this.translate.bind(this),this.submitButton=(a=window.fluentcart_checkout_vars)==null?void 0:a.submit_button}translate(e){var o;return(((o=window.fct_mollie_data)==null?void 0:o.translations)||{})[e]||e}renderPaymentMethods(e){if(!e||!Array.isArray(e)||e.length===0)return'<div class="mollie-payment-info"><p>'+this.$t("Pay securely with Mollie")+"</p></div>";let t='<div class="mollie-payment-methods">';t+='<div class="mollie-payment-methods-grid">',e.forEach(a=>{a.image&&(t+=`<div class="mollie-payment-method">
                    <img src="${a.image}" alt="${a.name||"Payment method"}" title="${a.name||"Payment method"}" />
                </div>`)});let o=this.$t("Available payment methods on Checkout");return t+="</div>",t+='<p class="mollie-payment-description">'+o+"</p>",t+="</div>",t+=`<style>
            .mollie-payment-methods {
                padding: 16px;
                border: 1px solid #e1e5e9;
                border-radius: 8px;
                background: #fff;
                margin-bottom: 16px;
            }
            .mollie-payment-methods-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                margin-bottom: 12px;
            }
            .mollie-payment-method {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 60px;
                height: 40px;
                border: 2px solid #e1e5e9;
                border-radius: 6px;
                background: #fff;
                overflow: hidden;
            }
            .mollie-payment-method img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
            }
            .mollie-payment-description {
                margin: 0;
                font-size: 14px;
                color: #656d76;
                text-align: center;
            }
        </style>`,t}async init(){var d,c,s,n;const e=this,t=(d=window.fluentcart_checkout_vars)==null?void 0:d.submit_button;let o=document.querySelector(".fluent-cart-checkout_embed_payment_container_mollie");if(o){let i=this.$t("Loading payment methods...");o.innerHTML='<div id="fct_loading_payment_processor">'+i+"</div>"}let a=((s=(c=this.data)==null?void 0:c.payment_args)==null?void 0:s.activat_methods)||[];o&&(o.innerHTML=this.renderPaymentMethods(a)),(n=this.paymentLoader)==null||n.enableCheckoutButton((t==null?void 0:t.text)||e.$t("Place Order"))}}window.addEventListener("fluent_cart_load_payments_mollie",function(l){var d,c,s;const e=(d=window.fluentcart_checkout_vars)==null?void 0:d.submit_button,t=document.querySelector(".fluent-cart-checkout_embed_payment_container_mollie"),o=((c=window.fct_mollie_data)==null?void 0:c.translations)||{};(s=l.detail.paymentLoader)==null||s.disableCheckoutButton((e==null?void 0:e.text)||"Place Order");function a(n){return o[n]||n}t&&(loadingMessage=a("Loading payment methods..."),t.innerHTML='<div id="fct_loading_payment_processor">'+loadingMessage+"</div>"),fetch(l.detail.paymentInfoUrl,{method:"POST",headers:{"Content-Type":"application/json","X-WP-Nonce":l.detail.nonce},credentials:"include"}).then(async n=>{var i;if(n=await n.json(),n.status=="failed"){let r=document.querySelector(".fluent-cart-checkout_embed_payment_container_mollie"),m=(n==null?void 0:n.message)||a("Something went wrong");r&&(r.innerHTML='<div id="fct_loading_payment_processor">'+a(m)+"</div>",r.style.display="block",r.querySelector("#fct_loading_payment_processor").style.color="#dc3545",r.querySelector("#fct_loading_payment_processor").style.fontSize="14px",(i=l.detail.paymentLoader)==null||i.enableCheckoutButton((e==null?void 0:e.text)||a("Place Order")))}else new p(l.detail.form,n,l.detail.paymentLoader).init()}).catch(n=>{var m;let i=document.querySelector(".fluent-cart-checkout_embed_payment_container_mollie"),r=a("Something went wrong");i&&(i.innerHTML='<div id="fct_loading_payment_processor">'+a(r)+"</div>",i.style.display="block",i.querySelector("#fct_loading_payment_processor").style.color="#dc3545",i.querySelector("#fct_loading_payment_processor").style.fontSize="14px",(m=l.detail.paymentLoader)==null||m.enableCheckoutButton((e==null?void 0:e.text)||a("Place Order")))})});
