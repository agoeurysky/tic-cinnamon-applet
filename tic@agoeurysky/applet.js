const Applet = imports.ui.applet;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Settings = imports.ui.settings;
const UUID = "tic@agoeurysky";

function MyApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(orientation, panel_height, instance_id) {
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        this.settings = new Settings.AppletSettings(this, UUID, this.instance_id);
        this.settings.bindProperty(Settings.BindingDirection.IN, "update-interval", "update_interval", this._new_freq, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "json-uri", "json_uri", null, null);

        this.set_applet_icon_name("flag-green");

        this.httpSession = new Soup.SessionAsync();

        this._update_loop();
    },

    _new_freq: function(){
        if (this._updateLoopID) {
			Mainloop.source_remove(this._updateLoopID);
		}
        this._update_loop();
    },
    
    on_applet_removed_from_panel: function () {
    // stop the loop when the applet is removed
	    if (this._updateLoopID) {
		    Mainloop.source_remove(this._updateLoopID);
	    }

    },

    _get_status: function(){
        let message = Soup.Message.new('GET', this.json_uri);
        this.httpSession.queue_message(message, (session, response) => {
            if (response.status_code !== 200) {
                var err = 'Failure to receive valid response from remote api ' + this.json_uri;
                global.logWarning(err);
                this.set_applet_label("... VA")
                this.set_applet_tooltip(err);
                this.set_applet_icon_name("error");
            } else {
                var value = this._get_tic_va(response.response_body.data);
                if (value < 500) {
                    this.set_applet_icon_name("flag-green");
                } else if (value < 1000) {
                    this.set_applet_icon_name("flag-blue");
                } else if (value < 3000) {
                    this.set_applet_icon_name("flag-yellow");
                } else {
                    this.set_applet_icon_name("flag-red");
                }
                this.set_applet_tooltip(_("PAPP value"));
                this.set_applet_label(value + " VA");
            }
        });
    },

    _get_tic_va: function(jsonResponse) {
        var value = 0;
        const ticArray = JSON.parse(jsonResponse);
        ticArray.forEach(item => {
            if (item.na == "PAPP") {value = +item.va;}
        });
        return value;
    },

    _update_loop: function () {
       this._get_status();
       this._updateLoopID = Mainloop.timeout_add(this.update_interval, Lang.bind(this, this._update_loop));
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
