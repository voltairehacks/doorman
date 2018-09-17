--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.14
-- Dumped by pg_dump version 9.5.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: devices; Type: TABLE; Schema: public; Owner: doorman
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    name text NOT NULL,
    mac text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    broadcasted text DEFAULT ''::text
);


ALTER TABLE public.devices OWNER TO doorman;

--
-- Name: devices_last_ip(public.devices); Type: FUNCTION; Schema: public; Owner: doorman
--

CREATE FUNCTION public.devices_last_ip(u public.devices) RETURNS text
    LANGUAGE sql STABLE
    AS $$
select B.ip from seen B INNER JOIN (select mac, max(time) as time from seen where seen.mac = u.mac group by mac) A ON A.mac = B.mac AND A.time = B.time;
$$;


ALTER FUNCTION public.devices_last_ip(u public.devices) OWNER TO doorman;

--
-- Name: devices_last_seen(public.devices); Type: FUNCTION; Schema: public; Owner: doorman
--

CREATE FUNCTION public.devices_last_seen(u public.devices) RETURNS timestamp without time zone
    LANGUAGE sql STABLE
    AS $$
select max(seen.time) from seen where seen.mac = u.mac group by seen.mac;
$$;


ALTER FUNCTION public.devices_last_seen(u public.devices) OWNER TO doorman;

--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: doorman
--

CREATE SEQUENCE public.devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.devices_id_seq OWNER TO doorman;

--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doorman
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: person; Type: TABLE; Schema: public; Owner: doorman
--

CREATE TABLE public.person (
    id integer NOT NULL,
    name text,
    created_at timestamp without time zone DEFAULT now(),
    avatar text DEFAULT ''::text,
    email text DEFAULT ''::text
);


ALTER TABLE public.person OWNER TO doorman;

--
-- Name: person_device; Type: TABLE; Schema: public; Owner: doorman
--

CREATE TABLE public.person_device (
    id integer NOT NULL,
    person integer,
    device integer
);


ALTER TABLE public.person_device OWNER TO doorman;

--
-- Name: person_device_id_seq; Type: SEQUENCE; Schema: public; Owner: doorman
--

CREATE SEQUENCE public.person_device_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.person_device_id_seq OWNER TO doorman;

--
-- Name: person_device_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doorman
--

ALTER SEQUENCE public.person_device_id_seq OWNED BY public.person_device.id;


--
-- Name: person_id_seq; Type: SEQUENCE; Schema: public; Owner: doorman
--

CREATE SEQUENCE public.person_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.person_id_seq OWNER TO doorman;

--
-- Name: person_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doorman
--

ALTER SEQUENCE public.person_id_seq OWNED BY public.person.id;


--
-- Name: seen; Type: TABLE; Schema: public; Owner: doorman
--

CREATE TABLE public.seen (
    id integer NOT NULL,
    mac text NOT NULL,
    ip text NOT NULL,
    "time" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.seen OWNER TO doorman;

--
-- Name: seen_id_seq; Type: SEQUENCE; Schema: public; Owner: doorman
--

CREATE SEQUENCE public.seen_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.seen_id_seq OWNER TO doorman;

--
-- Name: seen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: doorman
--

ALTER SEQUENCE public.seen_id_seq OWNED BY public.seen.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.person ALTER COLUMN id SET DEFAULT nextval('public.person_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.person_device ALTER COLUMN id SET DEFAULT nextval('public.person_device_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.seen ALTER COLUMN id SET DEFAULT nextval('public.seen_id_seq'::regclass);


--
-- Name: devices_pkey; Type: CONSTRAINT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: person_device_pkey; Type: CONSTRAINT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.person_device
    ADD CONSTRAINT person_device_pkey PRIMARY KEY (id);


--
-- Name: person_pkey; Type: CONSTRAINT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_pkey PRIMARY KEY (id);


--
-- Name: seen_pkey; Type: CONSTRAINT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.seen
    ADD CONSTRAINT seen_pkey PRIMARY KEY (id);


--
-- Name: devices_mac_idx; Type: INDEX; Schema: public; Owner: doorman
--

CREATE UNIQUE INDEX devices_mac_idx ON public.devices USING btree (mac);


--
-- Name: person_device_device_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.person_device
    ADD CONSTRAINT person_device_device_fkey FOREIGN KEY (device) REFERENCES public.devices(id);


--
-- Name: person_device_person_fkey; Type: FK CONSTRAINT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.person_device
    ADD CONSTRAINT person_device_person_fkey FOREIGN KEY (person) REFERENCES public.person(id);


--
-- Name: reference_device_mac; Type: FK CONSTRAINT; Schema: public; Owner: doorman
--

ALTER TABLE ONLY public.seen
    ADD CONSTRAINT reference_device_mac FOREIGN KEY (mac) REFERENCES public.devices(mac) MATCH FULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: doorman
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM doorman;
GRANT ALL ON SCHEMA public TO doorman;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

