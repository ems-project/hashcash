import CryptoJS from 'crypto-js';


export default function hashcash(target, onSubmitCallback, onSuccessCallback, onErrorCallback, onProgressCallback, DELIMITER) {

    function generateHashcash(form)
    {
        let value = form.getAttribute('data-hashcash-value') || false;

        if(value) {
            return value;
        }

        const cash = form.getAttribute('data-hashcash');
        const algo = form.getAttribute('data-hashalgo') || 'sha256';
        const noun = form.getAttribute('data-hashnoun') || 4;

        let random, hash, counter = 0;
        const regex = new RegExp("^0{"+noun+"}");
        const t0 = performance.now();

        do {
            random = Math.random().toString(36).substring(2, 15);
            value = [noun, cash, random].join(DELIMITER);
            hash = CryptoJS[algo.toUpperCase()](value).toString();
            ++counter;
        }
        while (!hash.match(regex));

        const t1 = performance.now();
        console.log(`Hashcash generated with ${counter} iterations in ${t1-t0} ms`);
        form.setAttribute('data-hashcash-value', value);

        return value;
    }

    function treatSubmit(form, e)
    {
        const hashcash_value = generateHashcash(form);

        const req = new XMLHttpRequest();

        req.open('POST', e.target.getAttribute('action'), true);
        req.setRequestHeader('X-Hashcash', hashcash_value);

        req.addEventListener("progress", function(evt) {
            if (onProgressCallback) {
                onProgressCallback(e.target, evt);
            }
            else {
                console.log("progress");
            }
        }, false);
        req.addEventListener("load", function(evt) {
            try {
                const jsonResponse = JSON.parse(req.responseText);

                if ( jsonResponse.ouuid && jsonResponse.success ) {
                    if (onSuccessCallback) {
                        onSuccessCallback(e.target, jsonResponse.ouuid);
                    }
                    else {
                        console.log('Your submit id: '+jsonResponse.ouuid);
                    }
                }
                else if ( jsonResponse.message ) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw jsonResponse.message;
                }
                else {
                    // noinspection ExceptionCaughtLocallyJS
                    throw evt.toString();
                }
            } catch(e) {
                if (onErrorCallback) {
                    onErrorCallback(e.target, e.toString());
                }
                else {
                    console.log(e.toString());
                }
            }

        }, false);
        req.addEventListener("error", function(evt) {
            if (onErrorCallback) {
                onErrorCallback(e.target, evt.toString());
            }
            else {
                console.log(evt.toString());
            }
        }, false);

        const formData = new FormData(e.target);
        req.send(formData);
    }

    if (!DELIMITER) {
        DELIMITER = "|";
    }

    console.log('Hashcash is initializing forms');
    const forms = target.querySelectorAll('form[data-hashcash]');
    for (const form of forms) {

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            if (onSubmitCallback) {
                onSubmitCallback(e.target);
            }
            else {
                console.log("submit");
            }
            //some delay to allow client to do something (like a waiting modal)
            setTimeout(treatSubmit, 50, form, e);

        }, false);
    }

}