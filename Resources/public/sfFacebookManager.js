/**
 * JQuery plugin managing Facebook SDK for Symfony 2 project.
 *
 * Dependencies: JQuery & FOSJsRoutingBundle.
 */

sfFacebookManager = (function ($) {
    var my = {
        'isLoaded': false,
        'options': {
            'appId': null,
            'cookie': true,
            'status': true,
            'xfbml': true,
            'oauth': true,
            'locale': 'fr_FR'
        },
        'routes': {
            'login': null,
            'loginCheck': null,
            'logout': null,
            'target': null
        },
        'events': [
            { 'name': 'auth.login', 'callback': function (response) { my.login(response); } },
            { 'name': 'auth.logout', 'callback': function (response) { my.logout(response); } }
        ]
    };

    my.setOptions = function (options) {
        try {
            if (!options.appId) {
                throw 'You must specify your facebook application ID.';
            }

            $.extend(my.options, options);
        } catch(error) {
            my.log(error);
        }
    }

    my.setRoutes = function (routes) {
        try {
            if (!routes.login) {
                throw 'You must specify your login route.';
            }

            if (!routes.loginCheck) {
                throw 'You must specify your login check route.';
            }

            if (!routes.logout) {
                throw 'You must specify your logout route';
            }

            if (!routes.target) {
                throw 'You must specify your target route';
            }

            my.routes = routes;
        } catch (error) {
            my.log(error);
        }
    }

    my.isReady = function () {
        return my.options.appId && my.routes.login;
    }

    my.load = function () {
        try {
            if (!my.isReady()) {
                throw 'The sfFacebookManager is not ready to be loaded. You must specify all mandatory routes & options.';
            }

            (function() {
                var containerId = 'fb-root';
                var container = document.getElementById(containerId);

                if (!container) {
                    var div = document.createElement('div');
                    div.id = containerId;

                    document.getElementsByTagName('body')[0].appendChild(div);
                }

                var js = document.createElement('script');
                js.type = 'text/javascript';
                js.async = true;
                js.src = document.location.protocol + '//connect.facebook.net/' + my.options.locale + '/all.js';

                document.getElementsByTagName('head')[0].appendChild(js);
            }());

            window.fbAsyncInit = function() {
                FB.init(my.options);
                my.isLoaded = true;

                for (event in my.events) {
                    my.subscribe(event.name, event.callback);
                }
            };
        } catch (error) {
            my.log(error)
        }
    }

    my.login = function (response) {
        if (!response || !response.status || !response.authResponse) {
            return;
        }

        var query = FB.Data.query('SELECT uid, email, first_name, last_name FROM user WHERE uid = {0}', response.authResponse.userID);
        query.wait(function (rows) {
            $.post(
                Routing.generate(my.routes.loginCheck), {
                    'facebook_id': rows[0].uid,
                    'email': rows[0].email,
                    'first_name': rows[0].first_name,
                    'last_name': rows[0].last_name
                },
                function (response) {
                    if (response && response.status) {
                        window.location = Routing.generate(my.routes.target);
                    }
                }
            );
        });
    };

    my.logout = function (response) {
        if (!response || !response.status) {
            return;
        }

        window.location = Routing.generate(my.routes.logout);
    };

    my.subscribe = function (name, callback) {
        if (my.isLoaded) {
            FB.Event.subscribe(name, callback);
        } else {
            my.events.push({
                'name': name,
                'callback': callback
            });
        }
    };

    my.log = function (error) {
        console.log('sfFacebookManager: ' + error);
    }

    return my;
})(jQuery);