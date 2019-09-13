import CryptoJS from 'crypto-js';


export default function hashcash(target, onSubmitCallback, onSuccessCallback, onErrorCallback, onProgressCallback, DELIMITER) {

    function toJSONString( form )
    {
        var obj = {};
        var elements = form.querySelectorAll( "input, select, textarea" );
        for( var i = 0; i < elements.length; ++i ) {
            var element = elements[i];
            var name = element.name;
            var value = element.value;

            if( name ) {
                obj[ name ] = value;
            }
        }

        return JSON.stringify( obj );
    }

    function generateHashcash(form, hashcash_value)
    {
        const cash = form.getAttribute('data-hashcash');
        const algo = form.getAttribute('data-hashalgo') || 'sha256';
        const noun = form.getAttribute('data-hashnoun') || 4;

        if(hashcash_value) {
            return hashcash_value;
        }

        let random, value, hash, counter = 0;
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

        return value;
    }

    if (!DELIMITER) {
        DELIMITER = "|";
    }

    console.log('Hashcash is initializing forms');
    const forms = target.querySelectorAll('form[data-hashcash]');
    for (const form of forms) {

        let hashcash_value = null;

        form.addEventListener('submit', function (e) {
            e.preventDefault();


            if (onSubmitCallback) {
                onSubmitCallback(e.target);
            }
            else {
                console.log("submit");
            }

            hashcash_value = generateHashcash(form, hashcash_value);

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
                        throw jsonResponse.message;
                    }
                    else {
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

        }, false);
    }

}